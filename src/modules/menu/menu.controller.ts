import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { MenuService } from './services/menu.service';
import { CreateMenuItemDto, UpdateMenuItemDto, MenuItemQueryDto } from './dto/menu-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Menu')
@Controller('menu')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.KITCHEN)
  @ApiOperation({ summary: 'Get all menu items' })
  @ApiResponse({ status: 200, description: 'List of menu items' })
  async findAll(@Query() query: MenuItemQueryDto) {
    return this.menuService.findAll({
      includeUnavailable: query.includeUnavailable,
      categoryId: query.categoryId,
      includeInactive: query.includeInactive,
    });
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.KITCHEN)
  @ApiOperation({ summary: 'Get menu item by ID' })
  @ApiParam({ name: 'id', description: 'Menu Item ID' })
  @ApiResponse({ status: 200, description: 'Menu item found' })
  @ApiResponse({ status: 404, description: 'Menu item not found' })
  async findOne(@Param('id') id: string) {
    return this.menuService.findById(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new menu item' })
  @ApiResponse({ status: 201, description: 'Menu item created' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 409, description: 'Menu item already exists' })
  async create(@Body() dto: CreateMenuItemDto) {
    return this.menuService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update menu item' })
  @ApiParam({ name: 'id', description: 'Menu Item ID' })
  @ApiResponse({ status: 200, description: 'Menu item updated' })
  @ApiResponse({ status: 404, description: 'Menu item not found' })
  async update(@Param('id') id: string, @Body() dto: UpdateMenuItemDto) {
    return this.menuService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete menu item (soft delete)' })
  @ApiParam({ name: 'id', description: 'Menu Item ID' })
  @ApiResponse({ status: 204, description: 'Menu item deleted' })
  @ApiResponse({ status: 404, description: 'Menu item not found' })
  async remove(@Param('id') id: string) {
    await this.menuService.delete(id);
  }
}
