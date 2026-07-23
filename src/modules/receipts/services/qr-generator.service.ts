import { Injectable, Logger } from '@nestjs/common';
import * as QRCode from 'qrcode';

@Injectable()
export class QrGeneratorService {
  private readonly logger = new Logger(QrGeneratorService.name);
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = process.env.APP_URL || 'https://napolitan.example.com';
  }

  async generateReceiptQRCode(receiptNumber: string): Promise<{ url: string; qrDataUrl: string }> {
    const receiptUrl = `${this.baseUrl}/receipt/${receiptNumber}`;

    const qrDataUrl = await QRCode.toDataURL(receiptUrl, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 256,
      margin: 2,
    });

    this.logger.debug(`Generated QR for receipt: ${receiptNumber}`);

    return {
      url: receiptUrl,
      qrDataUrl,
    };
  }

  getReceiptUrl(receiptNumber: string): string {
    return `${this.baseUrl}/receipt/${receiptNumber}`;
  }

  parseReceiptUrl(url: string): string | null {
    const match = url.match(/\/receipt\/(NP-\d{4}-\d{8})$/);
    return match ? match[1] : null;
  }
}
