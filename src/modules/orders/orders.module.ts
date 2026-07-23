import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './services/orders.service';
import { OrderStateMachine } from './services/order-state-machine.service';
import { PrismaService } from '../../common/services/prisma.service';
import { EventBus } from '../events/event-bus';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, OrderStateMachine, PrismaService, EventBus],
  exports: [OrdersService],
})
export class OrdersModule {}
