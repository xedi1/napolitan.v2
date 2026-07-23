import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../../common/services/prisma.service';
import { CryptoService } from './crypto.service';
import { WebhookStatus } from '@prisma/client';

export interface CreateWebhookParams {
  name: string;
  url: string;
  events: string[];
  headers?: string[];
  apiKeyId: string;
}

export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: any;
}

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAYS = [1000, 5000, 30000]; // Exponential backoff in ms

  constructor(
    private readonly prisma: PrismaService,
    private readonly cryptoService: CryptoService,
    @InjectQueue('webhooks') private readonly webhookQueue: Queue,
  ) {}

  async create(params: CreateWebhookParams): Promise<{ webhook: any; secret: string }> {
    const { secret, hashed } = this.cryptoService.generateWebhookSecret();

    const webhook = await this.prisma.webhook.create({
      data: {
        name: params.name,
        url: params.url,
        secret: hashed,
        events: params.events,
        headers: params.headers ? JSON.parse(JSON.stringify(params.headers)) : undefined,
        apiKeyId: params.apiKeyId,
      },
    });

    this.logger.log(`Created webhook: ${webhook.id} - ${webhook.name}`);

    return {
      webhook: {
        id: webhook.id,
        name: webhook.name,
        url: webhook.url,
        events: webhook.events,
        isActive: webhook.isActive,
        createdAt: webhook.createdAt,
        updatedAt: webhook.updatedAt,
      },
      secret,
    };
  }

  async findById(id: string) {
    const webhook = await this.prisma.webhook.findUnique({
      where: { id },
      include: { logs: { take: 10, orderBy: { createdAt: 'desc' } } },
    });

    if (!webhook) {
      throw new NotFoundException(`Webhook not found: ${id}`);
    }

    return webhook;
  }

  async findByApiKey(apiKeyId: string) {
    return this.prisma.webhook.findMany({
      where: { apiKeyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, params: { name?: string; url?: string; events?: string[]; isActive?: boolean }) {
    const webhook = await this.prisma.webhook.findUnique({ where: { id } });

    if (!webhook) {
      throw new NotFoundException(`Webhook not found: ${id}`);
    }

    return this.prisma.webhook.update({
      where: { id },
      data: params,
    });
  }

  async delete(id: string) {
    const webhook = await this.prisma.webhook.findUnique({ where: { id } });

    if (!webhook) {
      throw new NotFoundException(`Webhook not found: ${id}`);
    }

    // Delete logs first
    await this.prisma.webhookLog.deleteMany({ where: { webhookId: id } });

    // Delete webhook
    return this.prisma.webhook.delete({ where: { id } });
  }

  async getLogs(webhookId: string, params?: {
    event?: string;
    status?: WebhookStatus;
    limit?: number;
    offset?: number;
  }) {
    const where: any = { webhookId };
    if (params?.event) where.event = params.event;
    if (params?.status) where.status = params.status;

    const [logs, total] = await Promise.all([
      this.prisma.webhookLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: params?.limit || 50,
        skip: params?.offset || 0,
      }),
      this.prisma.webhookLog.count({ where }),
    ]);

    return { data: logs, total, limit: params?.limit || 50, offset: params?.offset || 0 };
  }

  async trigger(event: string, data: any) {
    // Find all webhooks subscribed to this event
    const webhooks = await this.prisma.webhook.findMany({
      where: {
        isActive: true,
        events: { has: event },
      },
    });

    this.logger.log(`Triggering webhook for event: ${event}, webhooks: ${webhooks.length}`);

    // Queue each webhook for delivery
    for (const webhook of webhooks) {
      const payload: WebhookPayload = {
        event,
        timestamp: new Date().toISOString(),
        data,
      };

      // Add to queue for async processing
      await this.webhookQueue.add('deliver', {
        webhookId: webhook.id,
        payload,
        attempt: 1,
      });
    }
  }

  async deliver(webhookId: string, payload: WebhookPayload, attempt: number = 1): Promise<boolean> {
    const webhook = await this.prisma.webhook.findUnique({ where: { id: webhookId } });

    if (!webhook || !webhook.isActive) {
      this.logger.warn(`Webhook not found or inactive: ${webhookId}`);
      return false;
    }

    // Create log entry
    const log = await this.prisma.webhookLog.create({
      data: {
        webhookId,
        event: payload.event,
        payload: payload as any,
        status: WebhookStatus.PENDING,
        attempt,
      },
    });

    const startTime = Date.now();
    const payloadString = JSON.stringify(payload);
    const signatureHeader = this.cryptoService.buildSignatureHeader(payloadString, webhook.secret);

    try {
      // Parse custom headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Webhook-Event': payload.event,
        'X-Webhook-Signature': signatureHeader,
        'X-Webhook-Timestamp': String(Math.floor(Date.now() / 1000)),
      };

      // Add custom headers if provided
      if (webhook.headers && Array.isArray(webhook.headers)) {
        for (const header of webhook.headers as string[]) {
          const colonIndex = header.indexOf(':');
          if (colonIndex > 0) {
            const key = header.substring(0, colonIndex).trim();
            const value = header.substring(colonIndex + 1).trim();
            if (key && value) {
              headers[key] = value;
            }
          }
        }
      }

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: payloadString,
        signal: AbortSignal.timeout(30000), // 30s timeout
      });

      const duration = Date.now() - startTime;
      const responseBody = await response.text().catch(() => '');

      // Update log with success
      await this.prisma.webhookLog.update({
        where: { id: log.id },
        data: {
          responseCode: response.status,
          responseBody: responseBody.substring(0, 1000), // Truncate
          status: response.ok ? WebhookStatus.SUCCESS : WebhookStatus.FAILED,
          duration,
        },
      });

      if (response.ok) {
        this.logger.log(`Webhook delivered successfully: ${webhookId}, event: ${payload.event}`);
        return true;
      } else {
        this.logger.warn(`Webhook delivery failed: ${webhookId}, status: ${response.status}`);
        return this.handleFailure(webhookId, payload, attempt, `HTTP ${response.status}`);
      }

    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.logger.error(`Webhook delivery error: ${webhookId}, error: ${error.message}`);

      return this.handleFailure(webhookId, payload, attempt, error.message);
    }
  }

  private async handleFailure(
    webhookId: string,
    payload: WebhookPayload,
    attempt: number,
    error: string,
  ): Promise<boolean> {
    if (attempt < this.MAX_RETRIES) {
      // Schedule retry with exponential backoff
      const delay = this.RETRY_DELAYS[attempt - 1] || 30000;

      await this.prisma.webhookLog.update({
        where: { webhookId, id: (await this.prisma.webhookLog.findFirst({ where: { webhookId, event: payload.event }, orderBy: { createdAt: 'desc' } }))?.id },
        data: { status: WebhookStatus.RETRYING, error },
      }).catch(() => {});

      await this.webhookQueue.add('deliver', {
        webhookId,
        payload,
        attempt: attempt + 1,
      }, { delay });

      this.logger.log(`Webhook retry scheduled: ${webhookId}, attempt: ${attempt + 1}, delay: ${delay}ms`);
      return false;
    } else {
      // Max retries reached
      await this.prisma.webhookLog.updateMany({
        where: { webhookId, event: payload.event, status: WebhookStatus.RETRYING },
        data: { status: WebhookStatus.FAILED, error },
      });

      this.logger.error(`Webhook delivery failed permanently: ${webhookId}, event: ${payload.event}`);
      return false;
    }
  }

  async findWebhooksForEvent(event: string) {
    return this.prisma.webhook.findMany({
      where: {
        isActive: true,
        events: { has: event },
      },
    });
  }
}
