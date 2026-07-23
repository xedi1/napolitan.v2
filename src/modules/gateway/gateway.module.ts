import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { OrdersGateway } from './orders.gateway';
import { OrdersGatewayListener } from './orders.gateway-listener';
import { EventBus } from '../events/event-bus';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '15m' },
    }),
  ],
  providers: [OrdersGateway, OrdersGatewayListener, EventBus],
  exports: [OrdersGateway, EventBus],
})
export class GatewayModule {}
