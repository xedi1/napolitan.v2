import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsEnum, IsBoolean, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { MeasurementUnit } from '@prisma/client';

export class CreateInventoryItemDto {
  @ApiProperty({ example: 'Tomato Sauce' })
  @IsString()
  name: string;

  @ApiProperty({ enum: MeasurementUnit, example: MeasurementUnit.KG })
  @IsEnum(MeasurementUnit)
  unit: MeasurementUnit;

  @ApiProperty({ example: 50 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  currentStock: number;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  alertLevel: number;
}

export class UpdateInventoryItemDto {
  @ApiPropertyOptional({ example: 'Tomato Sauce' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 45 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  currentStock?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  alertLevel?: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class AddStockDto {
  @ApiProperty({ example: 20 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  quantity: number;
}

export class InventoryQueryDto {
  @ApiPropertyOptional({ example: 'Tomato' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  lowStock?: boolean;
}
