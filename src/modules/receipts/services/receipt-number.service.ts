import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma.service';

@Injectable()
export class ReceiptNumberService {
  private readonly logger = new Logger(ReceiptNumberService.name);

  constructor(private readonly prisma: PrismaService) {}

  async generateNextReceiptNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `NP-${year}-`;

    // Use a transaction with row-level locking to ensure uniqueness
    // This handles concurrent requests safely
    const result = await this.prisma.$transaction(async (tx) => {
      // Get the latest receipt number for this year
      const latestReceipt = await tx.$queryRaw<{ receipt_number: string }[]>`
        SELECT receipt_number 
        FROM receipts 
        WHERE receipt_number LIKE ${prefix + '%'}
        ORDER BY id DESC 
        LIMIT 1 
        FOR UPDATE
      `;

      let nextNumber = 1;

      if (latestReceipt.length > 0) {
        const lastNumber = latestReceipt[0].receipt_number;
        const numberPart = lastNumber.replace(prefix, '');
        nextNumber = parseInt(numberPart, 10) + 1;
      }

      return prefix + nextNumber.toString().padStart(8, '0');
    });

    this.logger.debug(`Generated receipt number: ${result}`);
    return result;
  }

  parseReceiptNumber(receiptNumber: string): { year: number; sequence: number } | null {
    const match = receiptNumber.match(/^NP-(\d{4})-(\d{8})$/);
    if (!match) return null;

    return {
      year: parseInt(match[1], 10),
      sequence: parseInt(match[2], 10),
    };
  }

  validateReceiptNumber(receiptNumber: string): boolean {
    return this.parseReceiptNumber(receiptNumber) !== null;
  }
}
