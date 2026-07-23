import { Module } from '@nestjs/common';
import { AuditLogController } from './audit-log.controller';
import { AuditLogService } from './services/audit-log.service';
import { AuditLogListener } from './services/audit-log-listener.service';
import { PrismaService } from '../../common/services/prisma.service';

@Module({
  controllers: [AuditLogController],
  providers: [
    AuditLogService,
    AuditLogListener,
    PrismaService,
  ],
  exports: [AuditLogService],
})
export class AuditLogModule {}
