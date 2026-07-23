import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsEnum, IsBoolean, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole, ShiftStatus } from '@prisma/client';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  lastName: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: '+1234567890' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ enum: UserRole, example: UserRole.STAFF })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({ example: 'Head Chef' })
  @IsString()
  @IsOptional()
  position?: string;

  @ApiPropertyOptional({ example: 15.5 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  hourlyRate?: number;

  @ApiPropertyOptional({ enum: ShiftStatus, example: ShiftStatus.ON_DUTY })
  @IsEnum(ShiftStatus)
  @IsOptional()
  shiftStatus?: ShiftStatus;
}

export class UpdateEmployeeDto {
  @ApiPropertyOptional({ example: 'John' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({ example: '+1234567890' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ enum: UserRole, example: UserRole.STAFF })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiPropertyOptional({ example: 'Head Chef' })
  @IsString()
  @IsOptional()
  position?: string;

  @ApiPropertyOptional({ example: 15.5 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  hourlyRate?: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ enum: ShiftStatus, example: ShiftStatus.ON_DUTY })
  @IsEnum(ShiftStatus)
  @IsOptional()
  shiftStatus?: ShiftStatus;
}

export class EmployeeQueryDto {
  @ApiPropertyOptional({ example: 'John' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: UserRole })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiPropertyOptional({ enum: ShiftStatus })
  @IsEnum(ShiftStatus)
  @IsOptional()
  shiftStatus?: ShiftStatus;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
