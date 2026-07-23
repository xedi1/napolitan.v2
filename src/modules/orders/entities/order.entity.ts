import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';

export class OrderItemEntity {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  id: string;

  @ApiProperty({ example: 'Margherita Pizza' })
  menuItemName: string;

  @ApiProperty({ example: 2 })
  quantity: number;

  @ApiProperty({ example: 12.99 })
  unitPrice: number;

  @ApiPropertyOptional({ example: 'No onions please' })
  notes: string | null;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;
}

export class OrderEntity {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 1 })
  tableNumber: number;

  @ApiProperty({ enum: OrderStatus, example: OrderStatus.PENDING })
  status: OrderStatus;

  @ApiPropertyOptional({ example: 45.97 })
  totalAmount: number | null;

  @ApiPropertyOptional({ example: 'Birthday celebration' })
  notes: string | null;

  @ApiProperty({ example: 'John Doe' })
  createdByName: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ type: [OrderItemEntity] })
  items: OrderItemEntity[];
}

export class KitchenOrderEntity {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 1 })
  tableNumber: number;

  @ApiProperty({ enum: OrderStatus, example: OrderStatus.PENDING })
  status: OrderStatus;

  @ApiProperty({ type: [OrderItemEntity] })
  items: OrderItemEntity[];

  @ApiProperty({ example: 'John Doe' })
  createdByName: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;
}
