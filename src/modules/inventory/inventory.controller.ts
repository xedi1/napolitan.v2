import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { InventoryService } from './services/inventory.service';
import { RecipeService } from './services/recipe.service';
import { CreateInventoryItemDto, UpdateInventoryItemDto, AddStockDto, InventoryQueryDto } from './dto/inventory.dto';
import { CreateRecipeDto, UpdateRecipeDto } from './dto/recipe.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Inventory')
@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly recipeService: RecipeService,
  ) {}

  // ============ Inventory Items ============

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get all inventory items' })
  @ApiResponse({ status: 200, description: 'List of inventory items' })
  async findAll(@Query() query: InventoryQueryDto) {
    return this.inventoryService.findAll({
      search: query.search,
      isActive: query.isActive,
      lowStock: query.lowStock,
    });
  }

  @Get('low-stock')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get items below alert level' })
  @ApiResponse({ status: 200, description: 'Low stock items' })
  async getLowStock() {
    return this.inventoryService.getLowStockItems();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get inventory item by ID' })
  @ApiParam({ name: 'id', description: 'Inventory Item ID' })
  @ApiResponse({ status: 200, description: 'Inventory item found' })
  @ApiResponse({ status: 404, description: 'Inventory item not found' })
  async findOne(@Param('id') id: string) {
    return this.inventoryService.findById(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new inventory item' })
  @ApiResponse({ status: 201, description: 'Inventory item created' })
  async create(@Body() dto: CreateInventoryItemDto) {
    return this.inventoryService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update inventory item' })
  @ApiParam({ name: 'id', description: 'Inventory Item ID' })
  @ApiResponse({ status: 200, description: 'Inventory item updated' })
  @ApiResponse({ status: 404, description: 'Inventory item not found' })
  async update(@Param('id') id: string, @Body() dto: UpdateInventoryItemDto) {
    return this.inventoryService.update(id, dto);
  }

  @Post(':id/add-stock')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add stock to inventory item' })
  @ApiParam({ name: 'id', description: 'Inventory Item ID' })
  @ApiResponse({ status: 200, description: 'Stock added' })
  @ApiResponse({ status: 404, description: 'Inventory item not found' })
  async addStock(@Param('id') id: string, @Body() dto: AddStockDto) {
    return this.inventoryService.addStock(id, dto.quantity);
  }

  // ============ Recipes ============

  @Get('recipes')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get all recipes' })
  @ApiResponse({ status: 200, description: 'List of recipes' })
  async getAllRecipes() {
    return this.recipeService.findAll();
  }

  @Get('recipes/menu/:menuItemId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get recipe by menu item ID' })
  @ApiParam({ name: 'menuItemId', description: 'Menu Item ID' })
  @ApiResponse({ status: 200, description: 'Recipe found' })
  @ApiResponse({ status: 404, description: 'Recipe not found' })
  async getRecipeByMenuItem(@Param('menuItemId') menuItemId: string) {
    return this.recipeService.findByMenuItem(menuItemId);
  }

  @Get('recipes/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get recipe by ID' })
  @ApiParam({ name: 'id', description: 'Recipe ID' })
  @ApiResponse({ status: 200, description: 'Recipe found' })
  @ApiResponse({ status: 404, description: 'Recipe not found' })
  async getRecipe(@Param('id') id: string) {
    return this.recipeService.findById(id);
  }

  @Post('recipes')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new recipe' })
  @ApiResponse({ status: 201, description: 'Recipe created' })
  @ApiResponse({ status: 409, description: 'Recipe already exists' })
  async createRecipe(@Body() dto: CreateRecipeDto) {
    return this.recipeService.create(dto);
  }

  @Patch('recipes/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update recipe' })
  @ApiParam({ name: 'id', description: 'Recipe ID' })
  @ApiResponse({ status: 200, description: 'Recipe updated' })
  @ApiResponse({ status: 404, description: 'Recipe not found' })
  async updateRecipe(@Param('id') id: string, @Body() dto: UpdateRecipeDto) {
    return this.recipeService.update(id, dto);
  }
}
