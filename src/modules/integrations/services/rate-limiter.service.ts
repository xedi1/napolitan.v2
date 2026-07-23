import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma.service';
import { ApiKeyPermission } from '@prisma/client';

interface RateLimitConfig {
  READ: { windowMs: number; maxRequests: number };
  WRITE: { windowMs: number; maxRequests: number };
  ADMIN: { windowMs: number; maxRequests: number };
}

const RATE_LIMITS: RateLimitConfig = {
  READ: { windowMs: 60000, maxRequests: 100 },      // 100 requests/minute
  WRITE: { windowMs: 60000, maxRequests: 50 },     // 50 requests/minute
  ADMIN: { windowMs: 60000, maxRequests: 200 },    // 200 requests/minute
};

@Injectable()
export class RateLimiterService {
  private readonly logger = new Logger(RateLimiterService.name);

  constructor(private readonly prisma: PrismaService) {}

  async checkLimit(apiKeyId: string, permission: ApiKeyPermission): Promise<{
    allowed: boolean;
    limit: number;
    remaining: number;
    reset: Date;
  }> {
    const config = RATE_LIMITS[permission];
    const windowStart = new Date(Date.now() - config.windowMs);
    const windowEnd = new Date(Date.now() + config.windowMs);

    // Get or create rate limit record
    const record = await this.prisma.rateLimit.findFirst({
      where: {
        apiKeyId,
        windowStart: { gte: windowStart },
      },
    });

    const currentCount = record?.requestCount || 0;
    const allowed = currentCount < config.maxRequests;

    if (allowed) {
      // Increment counter
      if (record) {
        await this.prisma.rateLimit.update({
          where: { id: record.id },
          data: { requestCount: { increment: 1 } },
        });
      } else {
        await this.prisma.rateLimit.create({
          data: {
            apiKeyId,
            windowStart: new Date(),
            requestCount: 1,
          },
        });
      }
    }

    // Cleanup old records
    await this.cleanupOldRecords(apiKeyId);

    return {
      allowed,
      limit: config.maxRequests,
      remaining: Math.max(0, config.maxRequests - currentCount - (allowed ? 1 : 0)),
      reset: windowEnd,
    };
  }

  async getCurrentUsage(apiKeyId: string, permission: ApiKeyPermission): Promise<{
    limit: number;
    remaining: number;
    reset: Date;
  }> {
    const config = RATE_LIMITS[permission];
    const windowStart = new Date(Date.now() - config.windowMs);

    const record = await this.prisma.rateLimit.findFirst({
      where: {
        apiKeyId,
        windowStart: { gte: windowStart },
      },
    });

    const currentCount = record?.requestCount || 0;

    return {
      limit: config.maxRequests,
      remaining: Math.max(0, config.maxRequests - currentCount),
      reset: new Date(Date.now() + config.windowMs),
    };
  }

  private async cleanupOldRecords(apiKeyId: string) {
    // Remove rate limit records older than 2 minutes
    const cutoff = new Date(Date.now() - 120000);
    await this.prisma.rateLimit.deleteMany({
      where: {
        apiKeyId,
        windowStart: { lt: cutoff },
      },
    });
  }

  async resetLimit(apiKeyId: string) {
    await this.prisma.rateLimit.deleteMany({
      where: { apiKeyId },
    });
    this.logger.log(`Rate limit reset for API key: ${apiKeyId}`);
  }
}
