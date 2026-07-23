import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma.service';
import { NotificationType, NotificationRecipient } from '@prisma/client';

export interface CreateNotificationDto {
  type: NotificationType;
  title: string;
  message: string;
  recipient?: NotificationRecipient;
  metadata?: any;
  userId?: string;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateNotificationDto) {
    const notification = await this.prisma.notification.create({
      data: {
        type: dto.type,
        title: dto.title,
        message: dto.message,
        recipient: dto.recipient || NotificationRecipient.ALL,
        metadata: dto.metadata ? JSON.parse(JSON.stringify(dto.metadata)) : undefined,
        userId: dto.userId,
      },
    });

    this.logger.log(`Created notification: ${notification.id} - ${notification.title}`);
    return notification;
  }

  async findAll(params?: {
    recipient?: NotificationRecipient;
    isRead?: boolean;
    limit?: number;
  }) {
    const where: any = {};

    if (params?.recipient) {
      where.OR = [
        { recipient: params.recipient },
        { recipient: NotificationRecipient.ALL },
      ];
    }

    if (params?.isRead !== undefined) {
      where.isRead = params.isRead;
    }

    return this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: params?.limit || 50,
    });
  }

  async findUnread(recipient?: NotificationRecipient) {
    const where: any = { isRead: false };

    if (recipient) {
      where.OR = [
        { recipient },
        { recipient: NotificationRecipient.ALL },
      ];
    }

    return this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async markAllAsRead(recipient?: NotificationRecipient) {
    const where: any = { isRead: false };

    if (recipient) {
      where.OR = [
        { recipient },
        { recipient: NotificationRecipient.ALL },
      ];
    }

    return this.prisma.notification.updateMany({
      where,
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async getUnreadCount(recipient?: NotificationRecipient) {
    const where: any = { isRead: false };

    if (recipient) {
      where.OR = [
        { recipient },
        { recipient: NotificationRecipient.ALL },
      ];
    }

    return this.prisma.notification.count({ where });
  }
}
