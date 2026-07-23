import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './services/inventory.service';
import { RecipeService } from './services/recipe.service';
import { OrderInventoryListener } from './services/order-inventory.listener';
import { PrismaService } from '../../common/services/prisma.service';
import { EventBus } from '../events/event-bus';

@Module({
  controllers: [InventoryController],
  providers: [
    InventoryService,
    RecipeService,
    OrderInventoryListener,
    PrismaService,
    EventBus,
  ],
  exports: [InventoryService, RecipeService],
})
export class InventoryModule {}
