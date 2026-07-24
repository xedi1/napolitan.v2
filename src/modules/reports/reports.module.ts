import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './services/reports.service';
import { AnalyticsService } from './services/analytics.service';
import { AnalyticsListener } from './services/analytics-listener.service';
import { DashboardEventListener } from './services/dashboard-listener.service';
import { PrismaService } from '../../common/services/prisma.service';
import { EventBus } from '../events/event-bus';
import { OrdersGateway } from '../gateway/orders.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ReportsController],
  providers: [
    ReportsService,
    AnalyticsService,
    AnalyticsListener,
    DashboardEventListener,
    PrismaService,
    EventBus,
    OrdersGateway,
  ],
  exports: [ReportsService, AnalyticsService],
})
export class ReportsModule {}
