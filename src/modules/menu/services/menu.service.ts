import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma.service';
import { Prisma } from '@prisma/client';

export interface CreateMenuItemDto {
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  categoryId: string;
  isAvailable?: boolean;
}

export interface UpdateMenuItemDto {
  name?: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  isAvailable?: boolean;
  isActive?: boolean;
  categoryId?: string;
}

@Injectable()
export class MenuService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMenuItemDto) {
    // Verify category exists
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const existing = await this.prisma.menuItem.findFirst({
      where: { name: dto.name, categoryId: dto.categoryId },
    });

    if (existing) {
      throw new ConflictException('Menu item with this name already exists in this category');
    }

    const menuItem = await this.prisma.menuItem.create({
      data: {
        name: dto.name,
        description: dto.description,
        price: dto.price,
        imageUrl: dto.imageUrl,
        categoryId: dto.categoryId,
        isAvailable: dto.isAvailable ?? true,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return menuItem;
  }

  async findAll(params?: {
    includeUnavailable?: boolean;
    categoryId?: string;
    includeInactive?: boolean;
  }) {
    const where: Prisma.MenuItemWhereInput = {};

    if (!params?.includeUnavailable) {
      where.isAvailable = true;
    }

    if (!params?.includeInactive) {
      where.isActive = true;
    }

    if (params?.categoryId) {
      where.categoryId = params.categoryId;
    }

    const menuItems = await this.prisma.menuItem.findMany({
      where,
      orderBy: [
        { category: { displayOrder: 'asc' } },
        { name: 'asc' },
      ],
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return menuItems;
  }

  async findById(id: string) {
    const menuItem = await this.prisma.menuItem.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!menuItem) {
      throw new NotFoundException('Menu item not found');
    }

    return menuItem;
  }

  async update(id: string, dto: UpdateMenuItemDto) {
    await this.findById(id);

    if (dto.name && dto.categoryId) {
      const existing = await this.prisma.menuItem.findFirst({
        where: {
          name: dto.name,
          categoryId: dto.categoryId,
          id: { not: id },
        },
      });

      if (existing) {
        throw new ConflictException('Menu item with this name already exists in this category');
      }
    }

    const { categoryId, ...updateData } = dto;

    const menuItem = await this.prisma.menuItem.update({
      where: { id },
      data: updateData,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return menuItem;
  }

  async updateAvailability(id: string, isAvailable: boolean) {
    await this.findById(id);

    const menuItem = await this.prisma.menuItem.update({
      where: { id },
      data: { isAvailable },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return menuItem;
  }

  async delete(id: string) {
    await this.findById(id);

    // Soft delete by setting isActive to false
    await this.prisma.menuItem.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
