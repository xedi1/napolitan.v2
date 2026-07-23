import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { IntegrationsController } from './integrations.controller';
import { ApiKeyService } from './services/api-key.service';
import { WebhookService } from './services/webhook.service';
import { WebhookProcessor } from './services/webhook.processor';
import { CryptoService } from './services/crypto.service';
import { RateLimiterService } from './services/rate-limiter.service';
import { PrismaService } from '../../common/services/prisma.service';
import { ApiKeyAuthGuard } from '../../common/guards/api-key-auth.guard';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'webhooks',
    }),
  ],
  controllers: [IntegrationsController],
  providers: [
    ApiKeyService,
    WebhookService,
    WebhookProcessor,
    CryptoService,
    RateLimiterService,
    ApiKeyAuthGuard,
    PrismaService,
  ],
  exports: [
    ApiKeyService,
    WebhookService,
    CryptoService,
    RateLimiterService,
  ],
})
export class IntegrationsModule {}
