import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Roles')
@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class RolesController {
  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get all available roles' })
  @ApiResponse({
    status: 200,
    description: 'List of all roles',
    schema: {
      type: 'object',
      properties: {
        roles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', example: 'ADMIN' },
              description: { type: 'string', example: 'Full system access' },
            },
          },
        },
      },
    },
  })
  getAllRoles() {
    const roles = [
      {
        name: UserRole.ADMIN,
        description: 'Full system access - can manage all resources and users',
      },
      {
        name: UserRole.MANAGER,
        description: 'Can manage staff and view reports',
      },
      {
        name: UserRole.STAFF,
        description: 'Regular staff member with limited access',
      },
      {
        name: UserRole.KITCHEN,
        description: 'Kitchen staff access for order management',
      },
    ];

    return { roles };
  }
}
