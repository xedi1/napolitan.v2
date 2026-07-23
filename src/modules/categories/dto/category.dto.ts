import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Appetizers' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Start your meal with our delicious appetizers' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsNumber()
  @IsOptional()
  displayOrder?: number;
}

export class UpdateCategoryDto {
  @ApiPropertyOptional({ example: 'Appetizers & Starters' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Start your meal with our delicious appetizers' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 2 })
  @IsNumber()
  @IsOptional()
  displayOrder?: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class CategoryQueryDto {
  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  includeInactive?: boolean;
}
