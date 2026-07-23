import { Module } from '@nestjs/common';
import { TablesController } from './tables.controller';
import { TablesService } from './services/tables.service';
import { PrismaService } from '../../common/services/prisma.service';

@Module({
  controllers: [TablesController],
  providers: [TablesService, PrismaService],
  exports: [TablesService],
})
export class TablesModule {}
