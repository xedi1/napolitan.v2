import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsEnum, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum ReportPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

export class SalesReportQueryDto {
  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ enum: ReportPeriod, example: ReportPeriod.DAILY })
  @IsEnum(ReportPeriod)
  @IsOptional()
  period?: ReportPeriod;
}

export class SalesReportResponseDto {
  @ApiProperty({ example: '2026-01-15' })
  date: string;

  @ApiProperty({ example: 45 })
  totalOrders: number;

  @ApiProperty({ example: 2450.75 })
  totalRevenue: number;

  @ApiProperty({ example: 156 })
  totalItemsSold: number;

  @ApiProperty({ example: 54.46 })
  avgOrderValue: number;
}

export class TopItemsQueryDto {
  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ example: 10, description: 'Number of items to return' })
  @IsNumber()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({ enum: ['quantity', 'revenue'], default: 'quantity' })
  @IsString()
  @IsOptional()
  sortBy?: 'quantity' | 'revenue';
}

export class TopItemResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  menuItemId: string;

  @ApiProperty({ example: 'Margherita Pizza' })
  name: string;

  @ApiProperty({ example: 156 })
  quantitySold: number;

  @ApiProperty({ example: 1872.00 })
  revenue: number;

  @ApiProperty({ example: 12.00 })
  avgPrice: number;
}

export class PeakHoursQueryDto {
  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}

export class PeakHourResponseDto {
  @ApiProperty({ example: 12 })
  hour: number;

  @ApiProperty({ example: '12:00' })
  timeLabel: string;

  @ApiProperty({ example: 45 })
  orderCount: number;

  @ApiProperty({ example: 12.5 })
  percentage: number;
}

export class DashboardResponseDto {
  @ApiProperty({ example: 1250.50 })
  todayRevenue: number;

  @ApiProperty({ example: 28 })
  todayOrders: number;

  @ApiProperty({ example: 44.66 })
  avgOrderValue: number;

  @ApiProperty({ example: 45 })
  activeOrders: number;

  @ApiProperty({ example: 8 })
  tablesOccupied: number;

  @ApiProperty({ example: 12 })
  tablesTotal: number;

  @ApiProperty({ example: 5 })
  lowStockItems: number;

  @ApiProperty({ example: 85 })
  occupancyRate: number;

  @ApiProperty()
  revenueComparison: {
    vsYesterday: number;
    vsLastWeek: number;
    percentage: {
      vsYesterday: number;
      vsLastWeek: number;
    };
  };

  @ApiProperty()
  recentOrders: Array<{
    id: string;
    tableNumber: number;
    totalAmount: number;
    status: string;
    createdAt: Date;
  }>;

  @ApiProperty()
  topSellingItems: Array<{
    name: string;
    quantitySold: number;
  }>;
}
