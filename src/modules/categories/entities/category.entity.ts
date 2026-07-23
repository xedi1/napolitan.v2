import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CategoryEntity {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'Appetizers' })
  name: string;

  @ApiPropertyOptional({ example: 'Start your meal with our delicious appetizers' })
  description: string | null;

  @ApiProperty({ example: 1 })
  displayOrder: number;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;
}

export class CategoryWithItemsEntity extends CategoryEntity {
  @ApiPropertyOptional()
  menuItems?: MenuItemSimple[];
}

export class MenuItemSimple {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  id: string;

  @ApiProperty({ example: 'Bruschetta' })
  name: string;

  @ApiProperty({ example: true })
  isAvailable: boolean;
}
