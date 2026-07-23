import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventBus, OrderCreatedEvent, PaymentSuccessEvent } from '../../events/event-bus';
import { AnalyticsService } from './analytics.service';

@Injectable()
export class AnalyticsListener implements OnModuleInit {
  private readonly logger = new Logger(AnalyticsListener.name);

  constructor(
    private readonly eventBus: EventBus,
    private readonly analyticsService: AnalyticsService,
  ) {}

  onModuleInit() {
    this.logger.log('AnalyticsListener initialized');
  }

  @OnEvent('order.created')
  async handleOrderCreated(event: OrderCreatedEvent) {
    this.logger.debug(`Processing order.created for analytics: ${event.orderId}`);
    await this.analyticsService.onOrderCreated();
  }

  @OnEvent('payment.success')
  async handlePaymentSuccess(event: PaymentSuccessEvent) {
    this.logger.debug(`Processing payment.success for analytics: ${event.receiptNumber}`);
    await this.analyticsService.onPaymentSuccess({
      totalAmount: event.totalAmount,
    });
  }
}
