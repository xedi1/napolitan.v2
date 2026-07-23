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
import { TablesService } from './services/tables.service';
import { CreateTableDto, UpdateTableDto, TableStatusDto } from './dto/table.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Tables')
@Controller('tables')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Get all tables' })
  @ApiResponse({ status: 200, description: 'List of tables' })
  async findAll() {
    return this.tablesService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Get table by ID' })
  @ApiParam({ name: 'id', description: 'Table ID' })
  @ApiResponse({ status: 200, description: 'Table found' })
  @ApiResponse({ status: 404, description: 'Table not found' })
  async findOne(@Param('id') id: string) {
    return this.tablesService.findById(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new table' })
  @ApiResponse({ status: 201, description: 'Table created' })
  @ApiResponse({ status: 409, description: 'Table number already exists' })
  async create(@Body() dto: CreateTableDto) {
    return this.tablesService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update table' })
  @ApiParam({ name: 'id', description: 'Table ID' })
  @ApiResponse({ status: 200, description: 'Table updated' })
  @ApiResponse({ status: 404, description: 'Table not found' })
  async update(@Param('id') id: string, @Body() dto: UpdateTableDto) {
    return this.tablesService.update(id, dto);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Update table status' })
  @ApiParam({ name: 'id', description: 'Table ID' })
  @ApiResponse({ status: 200, description: 'Table status updated' })
  @ApiResponse({ status: 404, description: 'Table not found' })
  async updateStatus(@Param('id') id: string, @Body() dto: TableStatusDto) {
    return this.tablesService.updateStatus(id, dto.status);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete table' })
  @ApiParam({ name: 'id', description: 'Table ID' })
  @ApiResponse({ status: 204, description: 'Table deleted' })
  @ApiResponse({ status: 404, description: 'Table not found' })
  async remove(@Param('id') id: string) {
    await this.tablesService.delete(id);
  }
}
