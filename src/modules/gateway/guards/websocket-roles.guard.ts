import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { UserRole } from '@prisma/client';
import { AuthenticatedSocket } from './websocket-auth.guard';

@Injectable()
export class WebSocketRolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const client: Socket = context.switchToWs().getClient<Socket>();
    const authenticatedClient = client as AuthenticatedSocket;

    if (!authenticatedClient.user) {
      throw new WsException('Unauthorized');
    }

    const hasRole = requiredRoles.includes(authenticatedClient.user.role);

    if (!hasRole) {
      throw new WsException(`Access denied. Required roles: ${requiredRoles.join(', ')}`);
    }

    return true;
  }
}
