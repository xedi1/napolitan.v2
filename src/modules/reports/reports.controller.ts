import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './services/reports.service';
import { AnalyticsService } from './services/analytics.service';
import { SalesReportQueryDto, TopItemsQueryDto, PeakHoursQueryDto } from './dto/report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Reports')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  @Get('reports/sales')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get sales report' })
  @ApiResponse({ status: 200, description: 'Sales report data' })
  async getSalesReport(@Query() query: SalesReportQueryDto) {
    return this.reportsService.getSalesReport({
      startDate: query.startDate,
      endDate: query.endDate,
      period: query.period,
    });
  }

  @Get('reports/top-items')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get top selling and low selling items' })
  @ApiResponse({ status: 200, description: 'Top items report' })
  async getTopItems(@Query() query: TopItemsQueryDto) {
    return this.reportsService.getTopItems({
      startDate: query.startDate,
      endDate: query.endDate,
      limit: query.limit,
      sortBy: query.sortBy,
    });
  }

  @Get('reports/peak-hours')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get peak hours report' })
  @ApiResponse({ status: 200, description: 'Peak hours data' })
  async getPeakHours(@Query() query: PeakHoursQueryDto) {
    return this.reportsService.getPeakHours({
      startDate: query.startDate,
      endDate: query.endDate,
    });
  }

  @Get('analytics/dashboard')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get dashboard analytics' })
  @ApiResponse({ status: 200, description: 'Dashboard data' })
  async getDashboard() {
    return this.analyticsService.getDashboardData();
  }
}
