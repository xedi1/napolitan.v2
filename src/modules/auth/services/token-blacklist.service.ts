import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../../common/services/redis.service';

@Injectable()
export class TokenBlacklistService {
  private readonly logger = new Logger(TokenBlacklistService.name);

  // Access token TTL is 15 minutes
  private readonly ACCESS_TOKEN_TTL = 15 * 60;

  // Refresh token TTL is 7 days
  private readonly REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60;

  constructor(private readonly redisService: RedisService) {}

  /**
   * Blacklist an access token (for logout)
   */
  async blacklistAccessToken(token: string): Promise<void> {
    try {
      await this.redisService.addToBlacklist(token, this.ACCESS_TOKEN_TTL);
      this.logger.debug('Access token blacklisted');
    } catch (error) {
      this.logger.error(`Failed to blacklist access token: ${error.message}`);
    }
  }

  /**
   * Check if an access token is blacklisted
   */
  async isAccessTokenBlacklisted(token: string): Promise<boolean> {
    try {
      return await this.redisService.isBlacklisted(token);
    } catch (error) {
      this.logger.error(`Failed to check blacklist: ${error.message}`);
      // Fail open - if Redis is down, don't block all requests
      return false;
    }
  }

  /**
   * Invalidate all refresh tokens for a user (force logout on all devices)
   */
  async invalidateAllUserRefreshTokens(userId: string): Promise<void> {
    try {
      await this.redisService.invalidateAllUserRefreshTokens(userId);
      this.logger.log(`All refresh tokens invalidated for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to invalidate refresh tokens: ${error.message}`);
    }
  }

  /**
   * Invalidate a specific token family (for targeted logout)
   */
  async invalidateTokenFamily(userId: string, tokenFamily: string): Promise<void> {
    try {
      await this.redisService.invalidateRefreshTokenFamily(userId, tokenFamily);
      this.logger.log(`Token family ${tokenFamily} invalidated for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to invalidate token family: ${error.message}`);
    }
  }
}
