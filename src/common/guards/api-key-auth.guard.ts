import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiKeyService } from '../../modules/integrations/services/api-key.service';
import { RateLimiterService } from '../../modules/integrations/services/rate-limiter.service';
import { ApiKeyPermission } from '@prisma/client';

export const API_KEY_HEADER = 'x-api-key';

@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  constructor(
    private readonly apiKeyService: ApiKeyService,
    private readonly rateLimiterService: RateLimiterService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers[API_KEY_HEADER];

    if (!apiKey) {
      throw new UnauthorizedException('API Key is required');
    }

    // Validate the API key
    const result = await this.apiKeyService.validateKey(apiKey);
    if (!result.valid || !result.apiKey) {
      throw new UnauthorizedException('Invalid API Key');
    }

    // Check rate limit
    const rateLimit = await this.rateLimiterService.checkLimit(
      result.apiKey.id,
      result.apiKey.permissions,
    );

    // Set rate limit headers
    request.rateLimit = {
      limit: rateLimit.limit,
      remaining: rateLimit.remaining,
      reset: rateLimit.reset,
    };

    if (!rateLimit.allowed) {
      throw new ForbiddenException('Rate limit exceeded');
    }

    // Check permission requirements
    const requiredPermission = this.reflector.get<ApiKeyPermission>(
      'requiredPermission',
      context.getHandler(),
    );

    if (requiredPermission) {
      const permissionHierarchy: Record<ApiKeyPermission, number> = {
        ADMIN: 3,
        WRITE: 2,
        READ: 1,
      };

      if (permissionHierarchy[result.apiKey.permissions] < permissionHierarchy[requiredPermission]) {
        throw new ForbiddenException(`Insufficient permissions. Required: ${requiredPermission}`);
      }
    }

    // Attach API key to request
    request.apiKey = result.apiKey;

    return true;
  }
}
