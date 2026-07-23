import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ReceiptNumberService {
  private readonly logger = new Logger(ReceiptNumberService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate next receipt number using atomic UPDATE...RETURNING.
   * This is the preferred method - use inside a transaction with other DB operations.
   */
  async generateNextReceiptNumberInTransaction(tx: Prisma.TransactionClient): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `NP-${year}-`;

    // Use atomic UPDATE...RETURNING to get next sequence number
    // This prevents race conditions by using row-level locking
    const result = await tx.$queryRaw<{ sequence: bigint; year: number }[]>`
      INSERT INTO receipt_sequences (year, sequence)
      VALUES (${year}, 1)
      ON CONFLICT (year) DO UPDATE
      SET sequence = receipt_sequences.sequence + 1, updatedat = NOW()
      RETURNING sequence, year
    `;

    const sequence = result[0].sequence;
    const receiptNumber = prefix + sequence.toString().padStart(8, '0');

    this.logger.debug(`Generated receipt number: ${receiptNumber}`);
    return receiptNumber;
  }

  /**
   * Generate next receipt number - use this when called OUTSIDE a transaction.
   * WARNING: For atomic receipt creation, use generateNextReceiptNumberInTransaction instead.
   */
  async generateNextReceiptNumber(): Promise<string> {
    return this.generateNextReceiptNumberInTransaction(this.prisma);
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
