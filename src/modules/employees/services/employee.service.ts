import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateEmployeeDto, UpdateEmployeeDto } from '../dto/employee.dto';

@Injectable()
export class EmployeeService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEmployeeDto) {
    // Check if email already exists
    const existing = await this.prisma.employee.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Employee with this email already exists');
    }

    const employee = await this.prisma.employee.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        role: dto.role,
        position: dto.position,
        hourlyRate: dto.hourlyRate,
        shiftStatus: dto.shiftStatus || 'OFF',
      },
    });

    return this.formatEmployee(employee);
  }

  async findAll(params?: {
    search?: string;
    role?: string;
    shiftStatus?: string;
    isActive?: boolean;
  }) {
    const where: Prisma.EmployeeWhereInput = {};

    if (params?.isActive !== undefined) {
      where.isActive = params.isActive;
    }

    if (params?.role) {
      where.role = params.role as any;
    }

    if (params?.shiftStatus) {
      where.shiftStatus = params.shiftStatus as any;
    }

    if (params?.search) {
      where.OR = [
        { firstName: { contains: params.search, mode: 'insensitive' } },
        { lastName: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
        { position: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const employees = await this.prisma.employee.findMany({
      where,
      orderBy: [{ shiftStatus: 'asc' }, { lastName: 'asc' }],
    });

    return employees.map((emp) => this.formatEmployee(emp));
  }

  async findById(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    return this.formatEmployee(employee);
  }

  async update(id: string, dto: UpdateEmployeeDto) {
    const employee = await this.prisma.employee.findUnique({ where: { id } });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const updated = await this.prisma.employee.update({
      where: { id },
      data: dto,
    });

    return this.formatEmployee(updated);
  }

  async updateShiftStatus(id: string, shiftStatus: 'OFF' | 'ON_DUTY' | 'BREAK') {
    const employee = await this.prisma.employee.findUnique({ where: { id } });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const updated = await this.prisma.employee.update({
      where: { id },
      data: { shiftStatus },
    });

    return this.formatEmployee(updated);
  }

  async getOnDutyEmployees() {
    const employees = await this.prisma.employee.findMany({
      where: {
        isActive: true,
        shiftStatus: 'ON_DUTY',
      },
      orderBy: { position: 'asc' },
    });

    return employees.map((emp) => this.formatEmployee(emp));
  }

  private formatEmployee(employee: any) {
    return {
      id: employee.id,
      firstName: employee.firstName,
      lastName: employee.lastName,
      fullName: `${employee.firstName} ${employee.lastName}`,
      email: employee.email,
      phone: employee.phone,
      role: employee.role,
      position: employee.position,
      hourlyRate: employee.hourlyRate ? Number(employee.hourlyRate) : null,
      isActive: employee.isActive,
      hireDate: employee.hireDate,
      shiftStatus: employee.shiftStatus,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt,
    };
  }
}
