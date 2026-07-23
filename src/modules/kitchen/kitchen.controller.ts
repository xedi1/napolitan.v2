import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { OrdersService } from '../orders/services/orders.service';
import { UpdateOrderStatusDto } from '../orders/dto/order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Kitchen')
@Controller('kitchen')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class KitchenController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get('orders')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.KITCHEN)
  @ApiOperation({ summary: 'Get all active kitchen orders' })
  @ApiResponse({ status: 200, description: 'List of kitchen orders' })
  async getKitchenOrders() {
    return this.ordersService.findKitchenOrders();
  }

  @Patch('orders/:id/confirm')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.KITCHEN)
  @ApiOperation({ summary: 'Confirm a pending order' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order confirmed' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  async confirmOrder(@Param('id') id: string, @Request() req: any) {
    return this.ordersService.updateStatus(id, 'CONFIRMED', req.user.id);
  }

  @Patch('orders/:id/start')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.KITCHEN)
  @ApiOperation({ summary: 'Start preparing an order' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order is being prepared' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  async startPreparing(@Param('id') id: string, @Request() req: any) {
    return this.ordersService.updateStatus(id, 'PREPARING', req.user.id);
  }

  @Patch('orders/:id/ready')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.KITCHEN)
  @ApiOperation({ summary: 'Mark order as ready' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order is ready' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  async markReady(@Param('id') id: string, @Request() req: any) {
    return this.ordersService.updateStatus(id, 'READY', req.user.id);
  }

  @Patch('orders/:id/cancel')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.KITCHEN)
  @ApiOperation({ summary: 'Cancel an order' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order cancelled' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  async cancelOrder(@Param('id') id: string, @Request() req: any) {
    return this.ordersService.updateStatus(id, 'CANCELLED', req.user.id);
  }
}
