import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { UserRole } from '@prisma/client';

export interface AuthenticatedSocket extends Socket {
  user: {
    id: string;
    email: string;
    role: UserRole;
  };
}

@Injectable()
export class WebSocketAuthGuard implements CanActivate {
  private readonly logger = new Logger(WebSocketAuthGuard.name);

  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient<Socket>();
    const user = await this.validateToken(client);

    if (!user) {
      this.logger.warn(`Unauthorized WebSocket connection attempt from ${client.id}`);
      throw new WsException('Unauthorized');
    }

    // Attach user to socket for later use
    (client as AuthenticatedSocket).user = user;
    return true;
  }

  private async validateToken(client: Socket): Promise<{ id: string; email: string; role: UserRole } | null> {
    const token = this.extractToken(client);

    if (!token) {
      return null;
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      return {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      };
    } catch (error) {
      this.logger.debug(`Token validation failed: ${error.message}`);
      return null;
    }
  }

  private extractToken(client: Socket): string | null {
    // Try Authorization header first
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Try auth token in handshake
    const authToken = client.handshake.auth?.token;
    if (authToken) {
      return authToken;
    }

    return null;
  }
}
