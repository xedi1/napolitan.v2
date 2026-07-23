import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma.service';
import { EventBus } from '../../events/event-bus';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
  ) {}

  async getDashboardData() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    // Today's paid orders (via receipts)
    const todayReceipts = await this.prisma.receipt.findMany({
      where: {
        paidAt: { gte: today },
      },
    });
    const todayRevenue = todayReceipts.reduce((sum, r) => sum + Number(r.totalAmount || 0), 0);

    // Yesterday's stats
    const yesterdayReceipts = await this.prisma.receipt.findMany({
      where: {
        paidAt: {
          gte: yesterday,
          lt: today,
        },
      },
    });
    const yesterdayRevenue = yesterdayReceipts.reduce((sum, r) => sum + Number(r.totalAmount || 0), 0);

    // Last week's same day
    const lastWeekReceipts = await this.prisma.receipt.findMany({
      where: {
        paidAt: {
          gte: lastWeek,
          lt: new Date(lastWeek.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });
    const lastWeekRevenue = lastWeekReceipts.reduce((sum, r) => sum + Number(r.totalAmount || 0), 0);

    // Active orders
    const activeOrders = await this.prisma.order.findMany({
      where: {
        status: {
          in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED'],
        },
      },
    });

    // Tables
    const tables = await this.prisma.table.findMany();
    const occupiedTables = tables.filter((t) => t.status === 'OCCUPIED');

    // Low stock items (simple comparison)
    const allInventoryItems = await this.prisma.inventoryItem.findMany({
      where: { isActive: true },
    });
    const lowStockItems = allInventoryItems.filter(
      (item) => Number(item.currentStock) < Number(item.alertLevel),
    );

    // Recent orders
    const recentOrders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: today },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        table: { select: { tableNumber: true } },
      },
    });

    // Top selling items today
    const topItems = await this.getTopSellingItems(today, 5);

    // Revenue comparison
    const vsYesterday = todayRevenue - yesterdayRevenue;
    const vsLastWeek = todayRevenue - lastWeekRevenue;

    return {
      todayRevenue: Math.round(todayRevenue * 100) / 100,
      todayOrders: todayReceipts.length,
      avgOrderValue: todayReceipts.length > 0 
        ? Math.round((todayRevenue / todayReceipts.length) * 100) / 100 
        : 0,
      activeOrders: activeOrders.length,
      tablesOccupied: occupiedTables.length,
      tablesTotal: tables.length,
      occupancyRate: tables.length > 0 
        ? Math.round((occupiedTables.length / tables.length) * 100) 
        : 0,
      lowStockItems: lowStockItems.length,
      revenueComparison: {
        vsYesterday: Math.round(vsYesterday * 100) / 100,
        vsLastWeek: Math.round(vsLastWeek * 100) / 100,
        percentage: {
          vsYesterday: yesterdayRevenue > 0 
            ? Math.round((vsYesterday / yesterdayRevenue) * 100) 
            : 0,
          vsLastWeek: lastWeekRevenue > 0 
            ? Math.round((vsLastWeek / lastWeekRevenue) * 100) 
            : 0,
        },
      },
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        tableNumber: o.table.tableNumber,
        totalAmount: Number(o.totalAmount),
        status: o.status,
        createdAt: o.createdAt,
      })),
      topSellingItems: topItems,
    };
  }

  private async getTopSellingItems(since: Date, limit: number) {
    // Get orders created today with items
    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: since },
      },
      include: {
        items: {
          include: {
            menuItem: { select: { name: true } },
          },
        },
      },
    });

    const itemCounts = new Map<string, { name: string; quantity: number }>();

    orders.forEach((order) => {
      order.items?.forEach((item: any) => {
        const current = itemCounts.get(item.menuItemId) || {
          name: item.menuItem?.name || 'Unknown',
          quantity: 0,
        };
        current.quantity += item.quantity;
        itemCounts.set(item.menuItemId, current);
      });
    });

    return Array.from(itemCounts.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, limit);
  }

  // Called by event listeners for real-time updates
  async onOrderCreated() {
    this.logger.debug('Recalculating dashboard after order created');
    const dashboard = await this.getDashboardData();
    this.eventBus.emitDashboardUpdate({ type: 'dashboard', data: dashboard });
    return dashboard;
  }

  async onPaymentSuccess(receiptData: { totalAmount: number }) {
    this.logger.debug('Recalculating dashboard after payment');
    const dashboard = await this.getDashboardData();
    this.eventBus.emitDashboardUpdate({ type: 'dashboard', data: dashboard });
    return dashboard;
  }
}
