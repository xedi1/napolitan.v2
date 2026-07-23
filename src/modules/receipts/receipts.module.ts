import { Module } from '@nestjs/common';
import { ReceiptsController } from './receipts.controller';
import { ReceiptsService } from './services/receipts.service';
import { ReceiptNumberService } from './services/receipt-number.service';
import { PdfGeneratorService } from './services/pdf-generator.service';
import { QrGeneratorService } from './services/qr-generator.service';
import { PrismaService } from '../../common/services/prisma.service';
import { EventBus } from '../events/event-bus';

@Module({
  controllers: [ReceiptsController],
  providers: [
    ReceiptsService,
    ReceiptNumberService,
    PdfGeneratorService,
    QrGeneratorService,
    PrismaService,
    EventBus,
  ],
  exports: [ReceiptsService],
})
export class ReceiptsModule {}
