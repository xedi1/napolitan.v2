import { Injectable, UnauthorizedException, Logger, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { UsersService } from '../../../modules/users/services/users.service';
import { RedisService } from '../../../common/services/redis.service';
import { TokenBlacklistService } from './token-blacklist.service';
import { RegisterDto, LoginDto } from '../dto/auth.dto';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  jti?: string; // JWT ID for token tracking
  family?: string; // Token family for refresh rotation
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshTokenPayload {
  sub: string;
  email: string;
  role: string;
  jti: string;
  family: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  // Refresh token TTL is 7 days
  private readonly REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly tokenBlacklistService: TokenBlacklistService,
  ) {}

  async register(dto: RegisterDto) {
    const user = await this.usersService.create(dto);
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    this.logger.log(`User registered: ${user.email}`);

    return {
      tokens,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.usersService.validatePassword(
      dto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    this.logger.log(`User logged in: ${user.email}`);

    return {
      tokens,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  /**
   * Refresh tokens with rotation and reuse detection
   * 
   * Security features:
   * 1. Token rotation: Each refresh issues a new token pair
   * 2. Reuse detection: If an old token is used after rotation, invalidate entire family
   * 3. Token family: Groups tokens from same login session
   */
  async refreshToken(refreshToken: string): Promise<{ tokens: TokenPair; user: any }> {
    let payload: RefreshTokenPayload;

    try {
      payload = this.jwtService.verify<RefreshTokenPayload>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch (error) {
      this.logger.warn(`Invalid refresh token: ${error.message}`);
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Verify refresh token hasn't been used before (reused detection)
    const isValid = await this.redisService.isRefreshTokenValid(
      payload.sub,
      payload.family,
      payload.jti,
    );

    if (!isValid) {
      // Token reuse detected! This is a potential attack
      // Invalidate entire token family to force logout everywhere
      this.logger.warn(`Refresh token reuse detected for user ${payload.sub}, family ${payload.family}`);
      await this.tokenBlacklistService.invalidateTokenFamily(payload.sub, payload.family);
      throw new ForbiddenException('Token reuse detected. All sessions have been invalidated for security.');
    }

    const user = await this.usersService.findById(payload.sub);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User account is inactive or not found');
    }

    // Invalidate the old refresh token (prevents reuse)
    await this.redisService.invalidateRefreshToken(payload.sub, payload.family, payload.jti);

    // Generate new token pair with new refresh token
    const tokens = await this.generateTokensWithRotation(user.id, user.email, user.role, payload.family);

    this.logger.debug(`Token refreshed for user ${user.email}`);

    return {
      tokens,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  /**
   * Generate tokens with a new refresh token (rotation)
   */
  private async generateTokensWithRotation(
    userId: string,
    email: string,
    role: string,
    tokenFamily?: string,
  ): Promise<TokenPair> {
    const tokenFamilyId = tokenFamily || randomUUID();
    const refreshTokenId = randomUUID();

    const payload: RefreshTokenPayload = {
      sub: userId,
      email,
      role,
      jti: refreshTokenId,
      family: tokenFamilyId,
    };

    const accessToken = this.jwtService.sign(
      { sub: userId, email, role, jti: refreshTokenId },
      {
        secret: process.env.JWT_SECRET,
        expiresIn: '15m',
      },
    );

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    });

    // Store refresh token in Redis for rotation tracking
    await this.redisService.storeRefreshToken(
      userId,
      tokenFamilyId,
      refreshTokenId,
      this.REFRESH_TOKEN_TTL,
    );

    // Store token family if new
    if (!tokenFamily) {
      await this.redisService.storeTokenFamily(userId, tokenFamilyId, this.REFRESH_TOKEN_TTL);
    }

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
    };
  }

  private async generateTokens(
    userId: string,
    email: string,
    role: string,
  ): Promise<TokenPair> {
    return this.generateTokensWithRotation(userId, email, role);
  }

  /**
   * Logout - invalidate access token and all refresh tokens
   */
  async logout(accessToken: string, userId: string): Promise<void> {
    // Blacklist the access token
    await this.tokenBlacklistService.blacklistAccessToken(accessToken);

    // Invalidate all refresh tokens for this user
    await this.tokenBlacklistService.invalidateAllUserRefreshTokens(userId);

    this.logger.log(`User ${userId} logged out from all devices`);
  }

  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 900;

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        return 900;
    }
  }
}
