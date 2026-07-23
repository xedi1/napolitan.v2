import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsEnum, IsOptional } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class CreateReceiptDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  orderId: string;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.CASH })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;
}

export class ReceiptResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'NP-2026-00001251' })
  receiptNumber: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  orderId: string;

  @ApiProperty({ example: 45.97 })
  totalAmount: number;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.CASH })
  paymentMethod: PaymentMethod;

  @ApiProperty({ example: '2026-07-23T10:30:00.000Z' })
  paidAt: Date;

  @ApiPropertyOptional({ example: 'https://example.com/receipt/NP-2026-00001251' })
  receiptUrl: string | null;

  @ApiProperty({ example: '2026-07-23T10:30:00.000Z' })
  createdAt: Date;
}

export class ReceiptQueryDto {
  @ApiPropertyOptional({ example: 'NP-2026-00001251' })
  @IsString()
  @IsOptional()
  receiptNumber?: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  @IsOptional()
  orderId?: string;
}
