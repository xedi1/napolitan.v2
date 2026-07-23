import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableStatus } from '@prisma/client';

export class TableEntity {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 1 })
  tableNumber: number;

  @ApiProperty({ example: 4 })
  capacity: number;

  @ApiProperty({ enum: TableStatus, example: TableStatus.EMPTY })
  status: TableStatus;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;
}

export class TableWithStatusEntity extends TableEntity {
  @ApiPropertyOptional({ example: 'Available for seating' })
  statusDescription?: string;
}
