import { Module } from '@nestjs/common';
import { MenuController } from './menu.controller';
import { MenuService } from './services/menu.service';
import { PrismaService } from '../../common/services/prisma.service';

@Module({
  controllers: [MenuController],
  providers: [MenuService, PrismaService],
  exports: [MenuService],
})
export class MenuModule {}
