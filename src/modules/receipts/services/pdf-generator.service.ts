import { Injectable, Logger } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';

export interface ReceiptPDFData {
  receiptNumber: string;
  orderId: string;
  tableNumber: number;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  totalAmount: number;
  paymentMethod: string;
  paidAt: Date;
  createdByName: string;
}

@Injectable()
export class PdfGeneratorService {
  private readonly logger = new Logger(PdfGeneratorService.name);

  async generateReceiptPDF(data: ReceiptPDFData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A5', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).font('Helvetica-Bold').text('RECEIPT', { align: 'center' });
      doc.moveDown();

      // Receipt number
      doc.fontSize(12).font('Helvetica-Bold').text(`No: ${data.receiptNumber}`, { align: 'center' });
      doc.moveDown(0.5);

      // Divider
      doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke();
      doc.moveDown(0.5);

      // Date and table info
      const dateStr = new Date(data.paidAt).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      doc.fontSize(10).font('Helvetica');
      doc.text(`Date: ${dateStr}`, { align: 'left' });
      doc.text(`Table: ${data.tableNumber}`, { align: 'left' });
      doc.text(`Cashier: ${data.createdByName}`, { align: 'left' });
      doc.moveDown(0.5);

      // Divider
      doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke();
      doc.moveDown(0.5);

      // Items header
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Item', 50, doc.y, { width: 150 });
      doc.text('Qty', 200, doc.y, { width: 50, align: 'center' });
      doc.text('Price', 250, doc.y, { width: 80, align: 'right' });
      doc.text('Total', 330, doc.y, { width: 80, align: 'right' });
      doc.moveDown(0.5);

      // Items
      doc.font('Helvetica').fontSize(9);
      data.items.forEach((item) => {
        const y = doc.y;
        doc.text(item.name, 50, y, { width: 150 });
        doc.text(item.quantity.toString(), 200, y, { width: 50, align: 'center' });
        doc.text(`$${item.unitPrice.toFixed(2)}`, 250, y, { width: 80, align: 'right' });
        doc.text(`$${item.total.toFixed(2)}`, 330, y, { width: 80, align: 'right' });
        doc.moveDown(0.4);
      });

      doc.moveDown(0.5);

      // Divider
      doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke();
      doc.moveDown(0.5);

      // Total
      doc.fontSize(12).font('Helvetica-Bold');
      doc.text('TOTAL:', 250, doc.y, { width: 80, align: 'right' });
      doc.text(`$${data.totalAmount.toFixed(2)}`, 330, doc.y, { width: 80, align: 'right' });
      doc.moveDown();

      // Payment method
      doc.fontSize(10).font('Helvetica');
      doc.text(`Payment: ${data.paymentMethod}`, { align: 'center' });
      doc.moveDown(2);

      // Footer
      doc.fontSize(8).text('Thank you for your visit!', { align: 'center' });
      doc.text('Napolitan Restaurant', { align: 'center' });

      doc.end();
    });
  }
}
