import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma.service';

export interface CreateCategoryDto {
  name: string;
  description?: string;
  displayOrder?: number;
}

export interface UpdateCategoryDto {
  name?: string;
  description?: string;
  displayOrder?: number;
  isActive?: boolean;
}

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCategoryDto) {
    const existing = await this.prisma.category.findFirst({
      where: { name: dto.name },
    });

    if (existing) {
      throw new ConflictException('Category with this name already exists');
    }

    const category = await this.prisma.category.create({
      data: {
        name: dto.name,
        description: dto.description,
        displayOrder: dto.displayOrder ?? 0,
      },
    });

    return category;
  }

  async findAll(params?: { includeInactive?: boolean }) {
    const where = params?.includeInactive ? {} : { isActive: true };

    const categories = await this.prisma.category.findMany({
      where,
      orderBy: { displayOrder: 'asc' },
      include: {
        menuItems: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            isAvailable: true,
          },
        },
      },
    });

    return categories;
  }

  async findById(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        menuItems: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            isAvailable: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.findById(id);

    if (dto.name) {
      const existing = await this.prisma.category.findFirst({
        where: { name: dto.name, id: { not: id } },
      });

      if (existing) {
        throw new ConflictException('Category with this name already exists');
      }
    }

    const category = await this.prisma.category.update({
      where: { id },
      data: dto,
    });

    return category;
  }

  async delete(id: string) {
    await this.findById(id);

    // Soft delete by setting isActive to false
    await this.prisma.category.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
