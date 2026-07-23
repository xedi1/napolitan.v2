import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsEnum, IsArray, IsUrl, IsDateString } from 'class-validator';
import { ApiKeyPermission, WebhookStatus } from '@prisma/client';

// ============ API Key DTOs ============

export class CreateApiKeyDto {
  @ApiProperty({ example: 'Production API Key' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ enum: ApiKeyPermission, default: ApiKeyPermission.READ })
  @IsEnum(ApiKeyPermission)
  @IsOptional()
  permissions?: ApiKeyPermission;

  @ApiPropertyOptional({ example: '2027-01-01' })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}

export class ApiKeyResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'Production API Key' })
  name: string;

  @ApiProperty({ example: 'nk_xxxxxxxxxxxxxxxx' })
  keyPrefix: string;

  @ApiProperty({ example: 'WRITE' })
  permissions: ApiKeyPermission;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiPropertyOptional()
  lastUsedAt: Date | null;

  @ApiPropertyOptional()
  expiresAt: Date | null;

  @ApiProperty()
  createdAt: Date;
}

export class ApiKeyCreatedResponseDto extends ApiKeyResponseDto {
  @ApiProperty({ 
    example: 'nk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    description: 'Full API key - only shown once at creation'
  })
  fullKey: string;
}

// ============ Webhook DTOs ============

export class CreateWebhookDto {
  @ApiProperty({ example: 'Production Webhook' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'https://example.com/webhooks' })
  @IsUrl()
  url: string;

  @ApiProperty({ 
    example: ['order.created', 'payment.success'],
    description: 'Events to subscribe to'
  })
  @IsArray()
  @IsString({ each: true })
  events: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  headers?: string[];
}

export class UpdateWebhookDto {
  @ApiPropertyOptional({ example: 'Updated Webhook' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'https://example.com/webhooks-updated' })
  @IsUrl()
  @IsOptional()
  url?: string;

  @ApiPropertyOptional({ 
    example: ['order.created', 'payment.success', 'inventory.low_stock'],
    description: 'Events to subscribe to'
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  events?: string[];

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class WebhookResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'Production Webhook' })
  name: string;

  @ApiProperty({ example: 'https://example.com/webhooks' })
  url: string;

  @ApiProperty({ 
    example: ['order.created', 'payment.success'],
    description: 'Events to subscribe to'
  })
  events: string[];

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class WebhookCreatedResponseDto extends WebhookResponseDto {
  @ApiProperty({ 
    example: 'whsec_xxxxxxxxxxxxxxxx',
    description: 'Webhook secret - only shown once at creation'
  })
  secret: string;
}

// ============ Webhook Log DTOs ============

export class WebhookLogResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'order.created' })
  event: string;

  @ApiProperty({ example: { orderId: 'xxx', tableNumber: 5 } })
  payload: any;

  @ApiPropertyOptional({ example: 200 })
  responseCode: number | null;

  @ApiPropertyOptional({ example: 'OK' })
  responseBody: string | null;

  @ApiProperty({ enum: WebhookStatus })
  status: WebhookStatus;

  @ApiProperty({ example: 1 })
  attempt: number;

  @ApiPropertyOptional({ example: 'Connection timeout' })
  error: string | null;

  @ApiPropertyOptional({ example: 1500 })
  duration: number | null;

  @ApiProperty()
  createdAt: Date;
}

export class WebhookLogsQueryDto {
  @ApiPropertyOptional({ example: 'order.created' })
  @IsString()
  @IsOptional()
  event?: string;

  @ApiPropertyOptional({ enum: WebhookStatus })
  @IsEnum(WebhookStatus)
  @IsOptional()
  status?: WebhookStatus;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  offset?: number;
}

// ============ Rate Limit DTOs ============

export class RateLimitResponseDto {
  @ApiProperty({ example: 100 })
  limit: number;

  @ApiProperty({ example: 45 })
  remaining: number;

  @ApiProperty({ example: 'Thu, 23 Jul 2026 10:00:00 GMT' })
  reset: string;
}
