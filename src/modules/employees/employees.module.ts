import { Module } from '@nestjs/common';
import { EmployeesController } from './employees.controller';
import { EmployeeService } from './services/employee.service';
import { PrismaService } from '../../common/services/prisma.service';

@Module({
  controllers: [EmployeesController],
  providers: [EmployeeService, PrismaService],
  exports: [EmployeeService],
})
export class EmployeesModule {}
