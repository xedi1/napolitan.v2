import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MenuItemEntity {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'Margherita Pizza' })
  name: string;

  @ApiPropertyOptional({ example: 'Classic Italian pizza with tomato and mozzarella' })
  description: string | null;

  @ApiProperty({ example: 12.99 })
  price: number;

  @ApiPropertyOptional({ example: 'https://example.com/images/margherita.jpg' })
  imageUrl: string | null;

  @ApiProperty({ example: true })
  isAvailable: boolean;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  categoryId: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;
}

export class MenuItemWithCategoryEntity extends MenuItemEntity {
  @ApiPropertyOptional()
  category?: CategorySimple;
}

export class CategorySimple {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  id: string;

  @ApiProperty({ example: 'Pizza' })
  name: string;
}
