import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;

  constructor() {
    this.client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) {
          this.logger.error('Redis connection failed after 3 retries');
          return null;
        }
        return Math.min(times * 100, 3000);
      },
    });

    this.client.on('error', (err) => {
      this.logger.error(`Redis error: ${err.message}`);
    });

    this.client.on('connect', () => {
      this.logger.log('Connected to Redis');
    });
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  getClient(): Redis {
    return this.client;
  }

  // Token blacklist operations
  async addToBlacklist(token: string, expiresInSeconds: number): Promise<void> {
    const key = `blacklist:${this.hashToken(token)}`;
    await this.client.setex(key, expiresInSeconds, '1');
  }

  async isBlacklisted(token: string): Promise<boolean> {
    const key = `blacklist:${this.hashToken(token)}`;
    const result = await this.client.get(key);
    return result === '1';
  }

  // Refresh token operations for rotation
  async storeRefreshToken(
    userId: string,
    tokenFamily: string,
    refreshTokenId: string,
    expiresInSeconds: number,
  ): Promise<void> {
    const key = `refresh:${userId}:${tokenFamily}:${refreshTokenId}`;
    await this.client.setex(key, expiresInSeconds, '1');
  }

  async invalidateRefreshTokenFamily(userId: string, tokenFamily: string): Promise<void> {
    const pattern = `refresh:${userId}:${tokenFamily}:*`;
    const keys = await this.client.keys(pattern);
    if (keys.length > 0) {
      await this.client.del(...keys);
    }
  }

  async invalidateAllUserRefreshTokens(userId: string): Promise<void> {
    const pattern = `refresh:${userId}:*`;
    const keys = await this.client.keys(pattern);
    if (keys.length > 0) {
      await this.client.del(...keys);
    }
  }

  async isRefreshTokenValid(
    userId: string,
    tokenFamily: string,
    refreshTokenId: string,
  ): Promise<boolean> {
    const key = `refresh:${userId}:${tokenFamily}:${refreshTokenId}`;
    const result = await this.client.get(key);
    return result === '1';
  }

  async invalidateRefreshToken(
    userId: string,
    tokenFamily: string,
    refreshTokenId: string,
  ): Promise<void> {
    const key = `refresh:${userId}:${tokenFamily}:${refreshTokenId}`;
    await this.client.del(key);
  }

  // Token family tracking for reuse detection
  async storeTokenFamily(userId: string, tokenFamily: string, expiresInSeconds: number): Promise<void> {
    const key = `family:${userId}:${tokenFamily}`;
    // Store the family with max lifetime (7 days + some buffer)
    await this.client.setex(key, expiresInSeconds, 'active');
  }

  async isTokenFamilyActive(userId: string, tokenFamily: string): Promise<boolean> {
    const key = `family:${userId}:${tokenFamily}`;
    const result = await this.client.get(key);
    return result === 'active';
  }

  private hashToken(token: string): string {
    // Use a simple hash for token fingerprinting
    // In production, use crypto.createHash('sha256')
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      const char = token.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }
}
