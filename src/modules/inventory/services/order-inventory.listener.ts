import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventBus, OrderCreatedEvent } from '../../events/event-bus';
import { RecipeService } from './recipe.service';

@Injectable()
export class OrderInventoryListener implements OnModuleInit {
  private readonly logger = new Logger(OrderInventoryListener.name);

  constructor(
    private readonly eventBus: EventBus,
    private readonly recipeService: RecipeService,
  ) {}

  onModuleInit() {
    this.logger.log('OrderInventoryListener initialized');
  }

  @OnEvent('order.created')
  async handleOrderCreated(event: OrderCreatedEvent) {
    this.logger.log(`Processing order.created event for inventory consumption: ${event.orderId}`);

    try {
      // Extract menu item IDs and quantities from order
      const orderItems = event.items.map((item) => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
      }));

      // Consume inventory based on recipes
      const consumptionResults = await this.recipeService.consumeForOrder(orderItems);

      // Log consumption results
      for (const result of consumptionResults) {
        if (result.consumed.length > 0) {
          this.logger.log(
            `Consumed inventory for ${result.menuItemName}: ` +
            result.consumed.map((c) => `${c.consumedQuantity} ${c.unit} of ${c.inventoryItemName}`).join(', '),
          );
        }

        if (result.insufficientStock.length > 0) {
          this.logger.warn(
            `Insufficient stock for ${result.menuItemName}: ` +
            result.insufficientStock.map((s) => `${s.required} ${s.unit} of ${s.inventoryItemName} (only ${s.available} available)`).join(', '),
          );
        }
      }
    } catch (error) {
      this.logger.error(`Failed to consume inventory for order ${event.orderId}: ${error.message}`);
    }
  }
}
