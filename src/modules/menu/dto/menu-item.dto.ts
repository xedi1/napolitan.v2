import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsBoolean, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMenuItemDto {
  @ApiProperty({ example: 'Margherita Pizza' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Classic Italian pizza with tomato and mozzarella' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 12.99 })
  @IsNumber()
  @Type(() => Number)
  price: number;

  @ApiPropertyOptional({ example: 'https://example.com/images/margherita.jpg' })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  categoryId: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;
}

export class UpdateMenuItemDto {
  @ApiPropertyOptional({ example: 'Margherita Pizza' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Classic Italian pizza with tomato and mozzarella' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 14.99 })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({ example: 'https://example.com/images/margherita.jpg' })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  @IsOptional()
  categoryId?: string;
}

export class MenuItemQueryDto {
  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  includeUnavailable?: boolean;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  includeInactive?: boolean;
}
