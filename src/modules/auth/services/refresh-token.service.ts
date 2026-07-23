import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../../../common/services/prisma.service';
import { RefreshToken } from '@prisma/client';

@Injectable()
export class RefreshTokenService {
  private readonly logger = new Logger(RefreshTokenService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Hash a token using SHA-256
   */
  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /**
   * Create a new refresh token record in the database
   */
  async createRefreshToken(
    userId: string,
    token: string,
    family: string,
    expiresInSeconds: number,
  ): Promise<RefreshToken> {
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

    return this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        family,
        expiresAt,
      },
    });
  }

  /**
   * Find a valid (non-revoked, non-expired) refresh token by hash
   */
  async findValidToken(token: string): Promise<RefreshToken | null> {
    const tokenHash = this.hashToken(token);

    const refreshToken = await this.prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    return refreshToken;
  }

  /**
   * Revoke a specific refresh token
   */
  async revokeToken(token: string): Promise<void> {
    const tokenHash = this.hashToken(token);

    await this.prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Revoke all tokens in a family (for reuse detection)
   */
  async revokeFamily(family: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { family },
      data: { revokedAt: new Date() },
    });

    this.logger.warn(`Revoked all tokens in family: ${family}`);
  }

  /**
   * Revoke all tokens for a user (for logout)
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { revokedAt: new Date() },
    });

    this.logger.log(`Revoked all refresh tokens for user: ${userId}`);
  }

  /**
   * Check if a token is valid and return it
   */
  async validateToken(token: string): Promise<RefreshToken | null> {
    const tokenHash = this.hashToken(token);

    const refreshToken = await this.prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    return refreshToken;
  }

  /**
   * Clean up expired tokens (call periodically)
   */
  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { revokedAt: { not: null } },
        ],
      },
    });

    return result.count;
  }
}
