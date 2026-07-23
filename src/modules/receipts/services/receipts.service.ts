import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma.service';
import { EventBus } from '../../events/event-bus';
import { ReceiptNumberService } from './receipt-number.service';
import { PdfGeneratorService, ReceiptPDFData } from './pdf-generator.service';
import { QrGeneratorService } from './qr-generator.service';
import { PaymentMethod, OrderStatus } from '@prisma/client';

export interface CreateReceiptDto {
  orderId: string;
  paymentMethod: PaymentMethod;
  createdById: string;
}

export interface PaymentSuccessEvent {
  receiptId: string;
  receiptNumber: string;
  orderId: string;
  tableNumber: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paidAt: Date;
  receiptUrl: string;
}

@Injectable()
export class ReceiptsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
    private readonly receiptNumberService: ReceiptNumberService,
    private readonly pdfGeneratorService: PdfGeneratorService,
    private readonly qrGeneratorService: QrGeneratorService,
  ) {}

  async create(dto: CreateReceiptDto) {
    // Use atomic transaction to prevent race conditions
    // The entire receipt creation (number generation + insert) happens in one transaction
    const receipt = await this.prisma.$transaction(async (tx) => {
      // Verify order exists and is in SERVED status
      const order = await tx.order.findUnique({
        where: { id: dto.orderId },
        include: {
          table: { select: { tableNumber: true } },
          createdBy: { select: { firstName: true, lastName: true } },
          items: {
            include: { menuItem: { select: { name: true } } },
          },
          receipt: true,
        },
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      if (order.receipt) {
        throw new ConflictException('Receipt already exists for this order');
      }

      if (order.status !== OrderStatus.SERVED) {
        throw new BadRequestException(
          `Order must be in SERVED status to create receipt. Current status: ${order.status}`,
        );
      }

      // Generate unique receipt number WITHIN this transaction
      // This ensures the FOR UPDATE lock is held until receipt is inserted
      const receiptNumber = await this.receiptNumberService.generateNextReceiptNumberInTransaction(tx);

      // Generate QR code
      const { url: receiptUrl, qrDataUrl } = await this.qrGeneratorService.generateReceiptQRCode(receiptNumber);

      // Create receipt in the same transaction
      const newReceipt = await tx.receipt.create({
        data: {
          receiptNumber,
          orderId: dto.orderId,
          totalAmount: order.totalAmount!,
          paymentMethod: dto.paymentMethod,
          receiptUrl,
          qrCodeData: qrDataUrl,
        },
        include: {
          order: {
            include: {
              table: { select: { tableNumber: true } },
              createdBy: { select: { firstName: true, lastName: true } },
              items: {
                include: { menuItem: { select: { name: true } } },
              },
            },
          },
        },
      });

      // Update order status to PAID
      await tx.order.update({
        where: { id: dto.orderId },
        data: { status: OrderStatus.PAID },
      });

      return newReceipt;
    });

    // Emit payment.success event (outside transaction - fire and forget)
    const event: PaymentSuccessEvent = {
      receiptId: receipt.id,
      receiptNumber: receipt.receiptNumber,
      orderId: receipt.orderId,
      tableNumber: receipt.order.table.tableNumber,
      totalAmount: Number(receipt.totalAmount),
      paymentMethod: receipt.paymentMethod,
      paidAt: receipt.paidAt,
      receiptUrl: receipt.receiptUrl!,
    };
    this.eventBus.emitPaymentSuccess(event);

    return this.formatReceipt(receipt);
  }

  async findById(id: string) {
    const receipt = await this.prisma.receipt.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            table: { select: { tableNumber: true } },
            createdBy: { select: { firstName: true, lastName: true } },
            items: {
              include: { menuItem: { select: { name: true } } },
            },
          },
        },
      },
    });

    if (!receipt) {
      throw new NotFoundException('Receipt not found');
    }

    return this.formatReceipt(receipt);
  }

  async findByReceiptNumber(receiptNumber: string) {
    const receipt = await this.prisma.receipt.findUnique({
      where: { receiptNumber },
      include: {
        order: {
          include: {
            table: { select: { tableNumber: true } },
            createdBy: { select: { firstName: true, lastName: true } },
            items: {
              include: { menuItem: { select: { name: true } } },
            },
          },
        },
      },
    });

    if (!receipt) {
      throw new NotFoundException('Receipt not found');
    }

    return this.formatReceipt(receipt);
  }

  async generatePDF(id: string): Promise<Buffer> {
    const receipt = await this.prisma.receipt.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            table: { select: { tableNumber: true } },
            createdBy: { select: { firstName: true, lastName: true } },
            items: {
              include: { menuItem: { select: { name: true } } },
            },
          },
        },
      },
    });

    if (!receipt) {
      throw new NotFoundException('Receipt not found');
    }

    const pdfData: ReceiptPDFData = {
      receiptNumber: receipt.receiptNumber,
      orderId: receipt.orderId,
      tableNumber: receipt.order.table.tableNumber,
      items: receipt.order.items.map((item) => ({
        name: item.menuItem.name,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        total: Number(item.unitPrice) * item.quantity,
      })),
      totalAmount: Number(receipt.totalAmount),
      paymentMethod: receipt.paymentMethod,
      paidAt: receipt.paidAt,
      createdByName: `${receipt.order.createdBy.firstName || ''} ${receipt.order.createdBy.lastName || ''}`.trim(),
    };

    return this.pdfGeneratorService.generateReceiptPDF(pdfData);
  }

  async generateQRCode(id: string): Promise<{ url: string; qrDataUrl: string }> {
    const receipt = await this.prisma.receipt.findUnique({
      where: { id },
    });

    if (!receipt) {
      throw new NotFoundException('Receipt not found');
    }

    return this.qrGeneratorService.generateReceiptQRCode(receipt.receiptNumber);
  }

  async findAll(params?: { receiptNumber?: string; orderId?: string }) {
    const where: any = {};

    if (params?.receiptNumber) {
      where.receiptNumber = params.receiptNumber;
    }

    if (params?.orderId) {
      where.orderId = params.orderId;
    }

    const receipts = await this.prisma.receipt.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          include: {
            table: { select: { tableNumber: true } },
            createdBy: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    return receipts.map((receipt) => this.formatReceipt(receipt));
  }

  private formatReceipt(receipt: any) {
    return {
      id: receipt.id,
      receiptNumber: receipt.receiptNumber,
      orderId: receipt.orderId,
      tableNumber: receipt.order?.table?.tableNumber,
      totalAmount: receipt.totalAmount ? Number(receipt.totalAmount) : null,
      paymentMethod: receipt.paymentMethod,
      paidAt: receipt.paidAt,
      receiptUrl: receipt.receiptUrl,
      createdAt: receipt.createdAt,
      items: receipt.order?.items?.map((item: any) => ({
        name: item.menuItem?.name || 'Unknown Item',
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
      })) || [],
    };
  }
}
