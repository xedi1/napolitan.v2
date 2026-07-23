import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma.service';
import { TableStatus } from '@prisma/client';

export interface CreateTableDto {
  tableNumber: number;
  capacity: number;
}

export interface UpdateTableDto {
  tableNumber?: number;
  capacity?: number;
  status?: TableStatus;
}

@Injectable()
export class TablesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTableDto) {
    const existing = await this.prisma.table.findUnique({
      where: { tableNumber: dto.tableNumber },
    });

    if (existing) {
      throw new ConflictException(`Table with number ${dto.tableNumber} already exists`);
    }

    const table = await this.prisma.table.create({
      data: {
        tableNumber: dto.tableNumber,
        capacity: dto.capacity,
        status: TableStatus.EMPTY,
      },
    });

    return table;
  }

  async findAll() {
    const tables = await this.prisma.table.findMany({
      orderBy: { tableNumber: 'asc' },
    });

    return tables.map((table) => ({
      ...table,
      statusDescription: this.getStatusDescription(table.status),
    }));
  }

  async findById(id: string) {
    const table = await this.prisma.table.findUnique({
      where: { id },
    });

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    return {
      ...table,
      statusDescription: this.getStatusDescription(table.status),
    };
  }

  async findByTableNumber(tableNumber: number) {
    const table = await this.prisma.table.findUnique({
      where: { tableNumber },
    });

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    return {
      ...table,
      statusDescription: this.getStatusDescription(table.status),
    };
  }

  async update(id: string, dto: UpdateTableDto) {
    await this.findById(id);

    if (dto.tableNumber) {
      const existing = await this.prisma.table.findFirst({
        where: { tableNumber: dto.tableNumber, id: { not: id } },
      });

      if (existing) {
        throw new ConflictException(`Table with number ${dto.tableNumber} already exists`);
      }
    }

    const table = await this.prisma.table.update({
      where: { id },
      data: dto,
    });

    return {
      ...table,
      statusDescription: this.getStatusDescription(table.status),
    };
  }

  async updateStatus(id: string, status: TableStatus) {
    await this.findById(id);

    const table = await this.prisma.table.update({
      where: { id },
      data: { status },
    });

    return {
      ...table,
      statusDescription: this.getStatusDescription(table.status),
    };
  }

  async delete(id: string) {
    await this.findById(id);

    await this.prisma.table.delete({
      where: { id },
    });
  }

  private getStatusDescription(status: TableStatus): string {
    switch (status) {
      case TableStatus.EMPTY:
        return 'Available for seating';
      case TableStatus.RESERVED:
        return 'Reserved for upcoming guests';
      case TableStatus.OCCUPIED:
        return 'Currently occupied';
      default:
        return 'Unknown status';
    }
  }
}
