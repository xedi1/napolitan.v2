import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { TableStatus } from '@prisma/client';

export class CreateTableDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  tableNumber: number;

  @ApiProperty({ example: 4 })
  @IsInt()
  @Min(1)
  capacity: number;
}

export class UpdateTableDto {
  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  tableNumber?: number;

  @ApiPropertyOptional({ example: 6 })
  @IsInt()
  @Min(1)
  @IsOptional()
  capacity?: number;

  @ApiPropertyOptional({ enum: TableStatus, example: TableStatus.OCCUPIED })
  @IsEnum(TableStatus)
  @IsOptional()
  status?: TableStatus;
}

export class TableStatusDto {
  @ApiProperty({ enum: TableStatus, example: TableStatus.OCCUPIED })
  @IsEnum(TableStatus)
  status: TableStatus;
}
