import { Module, forwardRef } from '@nestjs/common';
import { OrdersGateway } from './orders.gateway';
import { OrdersGatewayListener } from './orders.gateway-listener';
import { EventBus } from '../events/event-bus';

@Module({
  providers: [OrdersGateway, OrdersGatewayListener, EventBus],
  exports: [OrdersGateway, EventBus],
})
export class GatewayModule {}
