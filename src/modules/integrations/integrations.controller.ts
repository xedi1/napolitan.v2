import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader, ApiParam } from '@nestjs/swagger';
import { Response } from 'express';
import { ApiKeyService } from './services/api-key.service';
import { WebhookService } from './services/webhook.service';
import { RateLimiterService } from './services/rate-limiter.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CreateApiKeyDto, CreateWebhookDto, UpdateWebhookDto, WebhookLogsQueryDto, RateLimitResponseDto } from './dto/integration.dto';

@ApiTags('Integrations')
@Controller('integrations')
@ApiBearerAuth()
export class IntegrationsController {
  constructor(
    private readonly apiKeyService: ApiKeyService,
    private readonly webhookService: WebhookService,
    private readonly rateLimiterService: RateLimiterService,
  ) {}

  // ============ API Keys ============

  @Post('api-keys')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new API Key' })
  @ApiResponse({ status: 201, description: 'API Key created successfully' })
  async createApiKey(@Body() dto: CreateApiKeyDto) {
    const result = await this.apiKeyService.create({
      name: dto.name,
      permissions: dto.permissions,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
    });

    return {
      success: true,
      message: 'API Key created successfully. Save the key now - it will not be shown again.',
      data: {
        ...result.apiKey,
        fullKey: result.fullKey,
      },
    };
  }

  @Get('api-keys')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List all API Keys' })
  @ApiResponse({ status: 200, description: 'List of API Keys' })
  async listApiKeys() {
    const apiKeys = await this.apiKeyService.findAll();
    return { data: apiKeys };
  }

  @Delete('api-keys/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke an API Key' })
  @ApiParam({ name: 'id', description: 'API Key ID' })
  @ApiResponse({ status: 200, description: 'API Key revoked' })
  async revokeApiKey(@Param('id') id: string) {
    await this.apiKeyService.revoke(id);
    return { success: true, message: 'API Key revoked successfully' };
  }

  // ============ Webhooks ============

  @Post('webhooks')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new Webhook' })
  @ApiResponse({ status: 201, description: 'Webhook created successfully' })
  async createWebhook(@Body() dto: CreateWebhookDto, @Query('apiKeyId') apiKeyId: string) {
    if (!apiKeyId) {
      throw new Error('apiKeyId query parameter is required');
    }

    const result = await this.webhookService.create({
      name: dto.name,
      url: dto.url,
      events: dto.events,
      headers: dto.headers,
      apiKeyId,
    });

    return {
      success: true,
      message: 'Webhook created successfully. Save the secret now - it will not be shown again.',
      data: {
        ...result.webhook,
        secret: result.secret,
      },
    };
  }

  @Get('webhooks')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'List all Webhooks' })
  @ApiResponse({ status: 200, description: 'List of Webhooks' })
  async listWebhooks(@Query('apiKeyId') apiKeyId: string) {
    if (!apiKeyId) {
      throw new Error('apiKeyId query parameter is required');
    }
    
    const webhooks = await this.webhookService.findByApiKey(apiKeyId);
    return { data: webhooks };
  }

  @Get('webhooks/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get Webhook details' })
  @ApiParam({ name: 'id', description: 'Webhook ID' })
  @ApiResponse({ status: 200, description: 'Webhook details' })
  async getWebhook(@Param('id') id: string) {
    const webhook = await this.webhookService.findById(id);
    return { data: webhook };
  }

  @Patch('webhooks/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update a Webhook' })
  @ApiParam({ name: 'id', description: 'Webhook ID' })
  @ApiResponse({ status: 200, description: 'Webhook updated' })
  async updateWebhook(@Param('id') id: string, @Body() dto: UpdateWebhookDto) {
    const webhook = await this.webhookService.update(id, dto);
    return { success: true, data: webhook };
  }

  @Delete('webhooks/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a Webhook' })
  @ApiParam({ name: 'id', description: 'Webhook ID' })
  @ApiResponse({ status: 200, description: 'Webhook deleted' })
  async deleteWebhook(@Param('id') id: string) {
    await this.webhookService.delete(id);
    return { success: true, message: 'Webhook deleted successfully' };
  }

  @Get('webhooks/:id/logs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get Webhook delivery logs' })
  @ApiParam({ name: 'id', description: 'Webhook ID' })
  @ApiResponse({ status: 200, description: 'Webhook logs' })
  async getWebhookLogs(@Param('id') id: string, @Query() query: WebhookLogsQueryDto) {
    const logs = await this.webhookService.getLogs(id, {
      event: query.event,
      status: query.status,
      limit: query.limit,
      offset: query.offset,
    });
    return logs;
  }

  // ============ Rate Limit ============

  @Get('rate-limit')
  @ApiHeader({ name: 'x-api-key', description: 'API Key', required: true })
  @ApiOperation({ summary: 'Get current rate limit status' })
  @ApiResponse({ status: 200, description: 'Rate limit info', type: RateLimitResponseDto })
  async getRateLimit(@Res() res: Response, @Body('apiKeyId') apiKeyId: string) {
    // This endpoint uses API Key auth via header
    const request = res.locals.request;
    if (request.rateLimit) {
      return res.json({
        limit: request.rateLimit.limit,
        remaining: request.rateLimit.remaining,
        reset: request.rateLimit.reset.toISOString(),
      });
    }
    return res.json({ limit: 0, remaining: 0, reset: new Date().toISOString() });
  }
}
