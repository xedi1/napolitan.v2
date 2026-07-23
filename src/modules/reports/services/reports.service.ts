import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma.service';
import { ReportPeriod } from '../dto/report.dto';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSalesReport(params: {
    startDate?: string;
    endDate?: string;
    period?: ReportPeriod;
  }) {
    const startDate = params.startDate 
      ? new Date(params.startDate) 
      : new Date(new Date().setDate(new Date().getDate() - 30));
    
    const endDate = params.endDate 
      ? new Date(params.endDate) 
      : new Date();

    endDate.setHours(23, 59, 59, 999);

    // Get paid orders via receipts
    const receipts = await this.prisma.receipt.findMany({
      where: {
        paidAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        order: {
          include: {
            items: true,
          },
        },
      },
    });

    const ordersWithPaidAt = receipts.map((r) => ({
      ...r.order,
      paidAt: r.paidAt,
    }));

    if (params.period === ReportPeriod.DAILY || !params.period) {
      return this.aggregateByDay(ordersWithPaidAt, startDate, endDate);
    }

    if (params.period === ReportPeriod.WEEKLY) {
      return this.aggregateByWeek(ordersWithPaidAt, startDate, endDate);
    }

    if (params.period === ReportPeriod.MONTHLY) {
      return this.aggregateByMonth(ordersWithPaidAt, startDate, endDate);
    }

    return this.aggregateByDay(ordersWithPaidAt, startDate, endDate);
  }

  private aggregateByDay(orders: any[], startDate: Date, endDate: Date) {
    const dailyMap = new Map<string, any>();

    // Initialize all days
    const current = new Date(startDate);
    while (current <= endDate) {
      const dateKey = current.toISOString().split('T')[0];
      dailyMap.set(dateKey, {
        date: dateKey,
        totalOrders: 0,
        totalRevenue: 0,
        totalItemsSold: 0,
        avgOrderValue: 0,
      });
      current.setDate(current.getDate() + 1);
    }

    // Aggregate orders
    orders.forEach((order) => {
      const dateKey = new Date(order.paidAt).toISOString().split('T')[0];
      const day = dailyMap.get(dateKey);
      if (day) {
        day.totalOrders++;
        day.totalRevenue += Number(order.totalAmount);
        day.totalItemsSold += order.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
      }
    });

    // Calculate averages
    return Array.from(dailyMap.values()).map((day) => ({
      ...day,
      avgOrderValue: day.totalOrders > 0 ? Math.round((day.totalRevenue / day.totalOrders) * 100) / 100 : 0,
    }));
  }

  private aggregateByWeek(orders: any[], startDate: Date, endDate: Date) {
    const weeklyMap = new Map<string, any>();

    orders.forEach((order) => {
      const date = new Date(order.paidAt);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weeklyMap.has(weekKey)) {
        weeklyMap.set(weekKey, {
          date: `${weekKey} (Week)`,
          totalOrders: 0,
          totalRevenue: 0,
          totalItemsSold: 0,
          avgOrderValue: 0,
        });
      }

      const week = weeklyMap.get(weekKey);
      week.totalOrders++;
      week.totalRevenue += Number(order.totalAmount);
      week.totalItemsSold += order.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
    });

    return Array.from(weeklyMap.values()).map((week) => ({
      ...week,
      avgOrderValue: week.totalOrders > 0 ? Math.round((week.totalRevenue / week.totalOrders) * 100) / 100 : 0,
    }));
  }

  private aggregateByMonth(orders: any[], startDate: Date, endDate: Date) {
    const monthlyMap = new Map<string, any>();

    orders.forEach((order) => {
      const date = new Date(order.paidAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          date: monthKey,
          totalOrders: 0,
          totalRevenue: 0,
          totalItemsSold: 0,
          avgOrderValue: 0,
        });
      }

      const month = monthlyMap.get(monthKey);
      month.totalOrders++;
      month.totalRevenue += Number(order.totalAmount);
      month.totalItemsSold += order.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
    });

    return Array.from(monthlyMap.values()).map((month) => ({
      ...month,
      avgOrderValue: month.totalOrders > 0 ? Math.round((month.totalRevenue / month.totalOrders) * 100) / 100 : 0,
    }));
  }

  async getTopItems(params: {
    startDate?: string;
    endDate?: string;
    limit?: number;
    sortBy?: 'quantity' | 'revenue';
  }) {
    const startDate = params.startDate 
      ? new Date(params.startDate) 
      : new Date(new Date().setDate(new Date().getDate() - 30));
    
    const endDate = params.endDate 
      ? new Date(params.endDate) 
      : new Date();

    endDate.setHours(23, 59, 59, 999);

    // Get paid orders via receipts
    const receipts = await this.prisma.receipt.findMany({
      where: {
        paidAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        order: {
          include: {
            items: {
              include: {
                menuItem: {
                  select: { id: true, name: true, price: true },
                },
              },
            },
          },
        },
      },
    });

    const orders = receipts.map((r) => r.order);

    // Aggregate by menu item
    const itemMap = new Map<string, {
      menuItemId: string;
      name: string;
      quantitySold: number;
      revenue: number;
    }>();

    orders.forEach((order) => {
      order.items?.forEach((item: any) => {
        if (!itemMap.has(item.menuItemId)) {
          itemMap.set(item.menuItemId, {
            menuItemId: item.menuItemId,
            name: item.menuItem.name,
            quantitySold: 0,
            revenue: 0,
          });
        }

        const stats = itemMap.get(item.menuItemId)!;
        stats.quantitySold += item.quantity;
        stats.revenue += Number(item.unitPrice) * item.quantity;
      });
    });

    const items = Array.from(itemMap.values()).map((item) => ({
      ...item,
      revenue: Math.round(item.revenue * 100) / 100,
      avgPrice: item.quantitySold > 0 ? Math.round((item.revenue / item.quantitySold) * 100) / 100 : 0,
    }));

    // Sort
    items.sort((a, b) => {
      if (params.sortBy === 'revenue') {
        return b.revenue - a.revenue;
      }
      return b.quantitySold - a.quantitySold;
    });

    return items.slice(0, params.limit || 10);
  }

  async getPeakHours(params: {
    startDate?: string;
    endDate?: string;
  }) {
    const startDate = params.startDate 
      ? new Date(params.startDate) 
      : new Date(new Date().setDate(new Date().getDate() - 30));
    
    const endDate = params.endDate 
      ? new Date(params.endDate) 
      : new Date();

    endDate.setHours(23, 59, 59, 999);

    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Count by hour
    const hourCounts = new Array(24).fill(0);
    const totalOrders = orders.length;

    orders.forEach((order) => {
      const hour = new Date(order.createdAt).getHours();
      hourCounts[hour]++;
    });

    // Format response
    return hourCounts.map((count, hour) => ({
      hour,
      timeLabel: `${String(hour).padStart(2, '0')}:00`,
      orderCount: count,
      percentage: totalOrders > 0 ? Math.round((count / totalOrders) * 10000) / 100 : 0,
    })).filter((h) => h.orderCount > 0)
      .sort((a, b) => b.orderCount - a.orderCount);
  }
}
