import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventBus, DashboardUpdateEvent } from '../../events/event-bus';
import { OrdersGateway } from '../../gateway/orders.gateway';

@Injectable()
export class DashboardEventListener implements OnModuleInit {
  private readonly logger = new Logger(DashboardEventListener.name);

  constructor(
    private readonly eventBus: EventBus,
    private readonly ordersGateway: OrdersGateway,
  ) {}

  onModuleInit() {
    this.logger.log('DashboardEventListener initialized');
  }

  @OnEvent('dashboard.update')
  handleDashboardUpdate(event: DashboardUpdateEvent) {
    this.logger.debug(`Broadcasting dashboard.update to connected clients`);
    
    this.ordersGateway.broadcastToRoom('dashboard', 'dashboard:update', {
      type: 'dashboard:update',
      data: event.data,
    });
  }

  @OnEvent('inventory.low_stock')
  handleInventoryLowStock(event: { items: string[]; timestamp: Date }) {
    this.logger.debug(`Broadcasting inventory.low_stock alert to dashboard`);
    
    this.ordersGateway.broadcastToRoom('dashboard', 'inventory:low_stock', {
      type: 'inventory:low_stock',
      data: {
        items: event.items,
        timestamp: event.timestamp,
      },
    });
  }
}
