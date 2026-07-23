import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Res,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiProduces } from '@nestjs/swagger';
import { Response } from 'express';
import { ReceiptsService } from './services/receipts.service';
import { CreateReceiptDto, ReceiptQueryDto } from './dto/receipt.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Receipts')
@Controller('receipts')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ReceiptsController {
  constructor(private readonly receiptsService: ReceiptsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new receipt for a served order' })
  @ApiResponse({ status: 201, description: 'Receipt created successfully' })
  @ApiResponse({ status: 400, description: 'Order not in SERVED status' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 409, description: 'Receipt already exists for this order' })
  async create(@Body() dto: CreateReceiptDto, @Request() req: any) {
    return this.receiptsService.create({
      ...dto,
      createdById: req.user.id,
    });
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Get all receipts' })
  @ApiResponse({ status: 200, description: 'List of receipts' })
  async findAll(@Query() query: ReceiptQueryDto) {
    return this.receiptsService.findAll({
      receiptNumber: query.receiptNumber,
      orderId: query.orderId,
    });
  }

  @Get('by-number/:receiptNumber')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Get receipt by receipt number' })
  @ApiParam({ name: 'receiptNumber', example: 'NP-2026-00001251' })
  @ApiResponse({ status: 200, description: 'Receipt found' })
  @ApiResponse({ status: 404, description: 'Receipt not found' })
  async findByNumber(@Param('receiptNumber') receiptNumber: string) {
    return this.receiptsService.findByReceiptNumber(receiptNumber);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Get receipt by ID' })
  @ApiParam({ name: 'id', description: 'Receipt ID' })
  @ApiResponse({ status: 200, description: 'Receipt found' })
  @ApiResponse({ status: 404, description: 'Receipt not found' })
  async findOne(@Param('id') id: string) {
    return this.receiptsService.findById(id);
  }

  @Get(':id/pdf')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Download receipt as PDF' })
  @ApiParam({ name: 'id', description: 'Receipt ID' })
  @ApiProduces('application/pdf')
  @ApiResponse({ status: 200, description: 'PDF file' })
  @ApiResponse({ status: 404, description: 'Receipt not found' })
  async getPdf(@Param('id') id: string, @Res() res: Response) {
    const pdfBuffer = await this.receiptsService.generatePDF(id);
    
    const receipt = await this.receiptsService.findById(id);
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${receipt.receiptNumber}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }

  @Get(':id/qr')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Get receipt QR code' })
  @ApiParam({ name: 'id', description: 'Receipt ID' })
  @ApiResponse({ status: 200, description: 'QR code data' })
  @ApiResponse({ status: 404, description: 'Receipt not found' })
  async getQr(@Param('id') id: string) {
    return this.receiptsService.generateQRCode(id);
  }
}
