import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ReceiptNumberService {
  private readonly logger = new Logger(ReceiptNumberService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate next receipt number - use this when called OUTSIDE a transaction.
   * WARNING: If you need atomic receipt creation, use generateNextReceiptNumberInTransaction instead.
   */
  async generateNextReceiptNumber(): Promise<string> {
    return this.generateNextReceiptNumberInternal(this.prisma);
  }

  /**
   * Generate next receipt number within an existing transaction.
   * Use this when you need atomic receipt creation to prevent race conditions.
   * The FOR UPDATE lock is held until the transaction commits.
   */
  async generateNextReceiptNumberInTransaction(tx: Prisma.TransactionClient): Promise<string> {
    return this.generateNextReceiptNumberInternal(tx);
  }

  private async generateNextReceiptNumberInternal(tx: Prisma.TransactionClient): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `NP-${year}-`;

    // Get the latest receipt number for this year with row-level locking
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

    const result = prefix + nextNumber.toString().padStart(8, '0');
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
