import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma.service';
import { EventBus } from '../../events/event-bus';
import { InventoryService } from './inventory.service';
import { CreateRecipeDto, UpdateRecipeDto } from '../dto/recipe.dto';

export interface InventoryConsumptionResult {
  menuItemId: string;
  menuItemName: string;
  consumed: Array<{
    inventoryItemId: string;
    inventoryItemName: string;
    consumedQuantity: number;
    unit: string;
    newStock: number;
    belowAlert: boolean;
  }>;
  insufficientStock: Array<{
    inventoryItemId: string;
    inventoryItemName: string;
    required: number;
    available: number;
    unit: string;
  }>;
}

@Injectable()
export class RecipeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
    private readonly inventoryService: InventoryService,
  ) {}

  async create(dto: CreateRecipeDto) {
    // Check if recipe already exists for this menu item
    const existing = await this.prisma.recipe.findUnique({
      where: { menuItemId: dto.menuItemId },
    });

    if (existing) {
      throw new ConflictException('Recipe already exists for this menu item. Use PUT to update.');
    }

    // Verify menu item exists
    const menuItem = await this.prisma.menuItem.findUnique({
      where: { id: dto.menuItemId },
    });

    if (!menuItem) {
      throw new NotFoundException('Menu item not found');
    }

    // Verify all inventory items exist
    const inventoryItemIds = dto.items.map((item) => item.inventoryItemId);
    const inventoryItems = await this.prisma.inventoryItem.findMany({
      where: { id: { in: inventoryItemIds } },
    });

    if (inventoryItems.length !== inventoryItemIds.length) {
      throw new NotFoundException('Some inventory items not found');
    }

    // Create recipe with items
    const recipe = await this.prisma.recipe.create({
      data: {
        menuItemId: dto.menuItemId,
        items: {
          create: dto.items.map((item) => {
            const invItem = inventoryItems.find((i) => i.id === item.inventoryItemId)!;
            return {
              inventoryItemId: item.inventoryItemId,
              quantity: item.quantity,
            };
          }),
        },
      },
      include: {
        menuItem: { select: { name: true } },
        items: {
          include: {
            inventoryItem: { select: { name: true, unit: true } },
          },
        },
      },
    });

    return this.formatRecipe(recipe);
  }

  async update(id: string, dto: UpdateRecipeDto) {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    // Verify all inventory items exist
    const inventoryItemIds = dto.items.map((item) => item.inventoryItemId);
    const inventoryItems = await this.prisma.inventoryItem.findMany({
      where: { id: { in: inventoryItemIds } },
    });

    if (inventoryItems.length !== inventoryItemIds.length) {
      throw new NotFoundException('Some inventory items not found');
    }

    // Delete existing items and create new ones
    await this.prisma.recipeItem.deleteMany({ where: { recipeId: id } });

    const updated = await this.prisma.recipe.update({
      where: { id },
      data: {
        items: {
          create: dto.items.map((item) => ({
            inventoryItemId: item.inventoryItemId,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        menuItem: { select: { name: true } },
        items: {
          include: {
            inventoryItem: { select: { name: true, unit: true } },
          },
        },
      },
    });

    return this.formatRecipe(updated);
  }

  async findByMenuItem(menuItemId: string) {
    const recipe = await this.prisma.recipe.findUnique({
      where: { menuItemId },
      include: {
        menuItem: { select: { name: true } },
        items: {
          include: {
            inventoryItem: { select: { id: true, name: true, unit: true, currentStock: true, alertLevel: true } },
          },
        },
      },
    });

    if (!recipe) {
      return null;
    }

    return this.formatRecipe(recipe);
  }

  async findById(id: string) {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id },
      include: {
        menuItem: { select: { name: true } },
        items: {
          include: {
            inventoryItem: { select: { id: true, name: true, unit: true, currentStock: true, alertLevel: true } },
          },
        },
      },
    });

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    return this.formatRecipe(recipe);
  }

  async findAll() {
    const recipes = await this.prisma.recipe.findMany({
      include: {
        menuItem: { select: { id: true, name: true } },
        items: {
          include: {
            inventoryItem: { select: { name: true, unit: true } },
          },
        },
      },
    });

    return recipes.map((recipe) => this.formatRecipe(recipe));
  }

  async consumeForOrder(orderItems: Array<{ menuItemId: string; quantity: number }>): Promise<InventoryConsumptionResult[]> {
    const results: InventoryConsumptionResult[] = [];
    const lowStockItems: string[] = [];

    for (const orderItem of orderItems) {
      const recipe = await this.findByMenuItem(orderItem.menuItemId);

      if (!recipe) {
        continue; // No recipe for this item, skip
      }

      const menuItem = await this.prisma.menuItem.findUnique({
        where: { id: orderItem.menuItemId },
        select: { name: true },
      });

      const consumed: InventoryConsumptionResult['consumed'] = [];
      const insufficientStock: InventoryConsumptionResult['insufficientStock'] = [];

      for (const ingredient of recipe.items) {
        const requiredQuantity = Number(ingredient.quantity) * orderItem.quantity;

        // Check if there's enough stock
        if (Number(ingredient.inventoryItem.currentStock) < requiredQuantity) {
          insufficientStock.push({
            inventoryItemId: ingredient.inventoryItem.id,
            inventoryItemName: ingredient.inventoryItem.name,
            required: requiredQuantity,
            available: Number(ingredient.inventoryItem.currentStock),
            unit: ingredient.inventoryItem.unit,
          });
          continue;
        }

        // Consume stock
        const result = await this.inventoryService.consumeStock(
          ingredient.inventoryItem.id,
          requiredQuantity,
        );

        consumed.push({
          inventoryItemId: ingredient.inventoryItem.id,
          inventoryItemName: ingredient.inventoryItem.name,
          consumedQuantity: requiredQuantity,
          unit: ingredient.inventoryItem.unit,
          newStock: result.newStock,
          belowAlert: result.belowAlert,
        });

        if (result.belowAlert) {
          lowStockItems.push(ingredient.inventoryItem.name);
        }
      }

      results.push({
        menuItemId: orderItem.menuItemId,
        menuItemName: menuItem?.name || 'Unknown',
        consumed,
        insufficientStock,
      });

      // Emit low stock event if any items are below alert
      if (lowStockItems.length > 0) {
        this.eventBus.emitInventoryLowStock({
          items: lowStockItems,
          timestamp: new Date(),
        });
      }
    }

    return results;
  }

  private formatRecipe(recipe: any) {
    return {
      id: recipe.id,
      menuItemId: recipe.menuItemId,
      menuItemName: recipe.menuItem?.name,
      items: recipe.items.map((item: any) => ({
        id: item.id,
        inventoryItemId: item.inventoryItemId,
        inventoryItemName: item.inventoryItem?.name,
        unit: item.inventoryItem?.unit,
        quantity: Number(item.quantity),
        currentStock: item.inventoryItem ? Number(item.inventoryItem.currentStock) : null,
        alertLevel: item.inventoryItem ? Number(item.inventoryItem.alertLevel) : null,
      })),
      createdAt: recipe.createdAt,
      updatedAt: recipe.updatedAt,
    };
  }
}
