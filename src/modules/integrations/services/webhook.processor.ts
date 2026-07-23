import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { WebhookService, WebhookPayload } from './webhook.service';

@Processor('webhooks')
export class WebhookProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhookProcessor.name);

  constructor(private readonly webhookService: WebhookService) {
    super();
  }

  async process(job: Job<{ webhookId: string; payload: WebhookPayload; attempt: number }>): Promise<void> {
    const { webhookId, payload, attempt } = job.data;

    this.logger.debug(`Processing webhook job: ${job.id}, webhook: ${webhookId}, attempt: ${attempt}`);

    await this.webhookService.deliver(webhookId, payload, attempt);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.debug(`Webhook job ${job.id} completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Webhook job ${job.id} failed: ${error.message}`);
  }
}
