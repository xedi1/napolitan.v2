import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationService } from './services/notification.service';
import { NotificationListener } from './services/notification-listener.service';
import { PrismaService } from '../../common/services/prisma.service';

@Module({
  controllers: [NotificationsController],
  providers: [
    NotificationService,
    NotificationListener,
    PrismaService,
  ],
  exports: [NotificationService],
})
export class NotificationsModule {}
