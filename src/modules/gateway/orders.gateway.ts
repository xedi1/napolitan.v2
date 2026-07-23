import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import { AuthenticatedSocket } from './guards/websocket-auth.guard';

// Room access permissions by role
const ROOM_PERMISSIONS: Record<string, UserRole[]> = {
  kitchen: [UserRole.ADMIN, UserRole.MANAGER, UserRole.KITCHEN],
  cashier: [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF],
  dashboard: [UserRole.ADMIN, UserRole.MANAGER],
};

function getCorsOrigin(): string | string[] {
  if (process.env.NODE_ENV === 'production') {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
    return allowedOrigins.length > 0 ? allowedOrigins : [];
  }
  return '*';
}

@WebSocketGateway({
  cors: {
    origin: getCorsOrigin(),
    credentials: true,
  },
  namespace: '/orders',
})
export class OrdersGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(OrdersGateway.name);
  private connectedClients = new Map<string, { socket: AuthenticatedSocket; rooms: Set<string>; user: any }>();

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const user = await this.validateToken(client);

      if (!user) {
        this.logger.warn(`Unauthorized connection attempt from ${client.id}`);
        client.emit('error', { message: 'Authentication required' });
        client.disconnect();
        return;
      }

      // Attach user to socket
      const authClient = client as AuthenticatedSocket;
      authClient.user = user;

      this.connectedClients.set(client.id, { 
        socket: authClient, 
        rooms: new Set(),
        user 
      });

      this.logger.log(`Client ${client.id} connected (user: ${user.email}, role: ${user.role})`);
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.emit('error', { message: 'Connection failed' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.connectedClients.delete(client.id);
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() room: string,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const authClient = client as AuthenticatedSocket;
    const user = authClient.user;

    if (!user) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    // Check room permissions
    const allowedRoles = ROOM_PERMISSIONS[room];
    if (!allowedRoles) {
      client.emit('error', { message: `Invalid room: ${room}` });
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      client.emit('error', { 
        message: `Access denied. You don't have permission to join ${room} room` 
      });
      this.logger.warn(`User ${user.email} (${user.role}) attempted to join unauthorized room: ${room}`);
      return;
    }

    client.join(room);
    const clientInfo = this.connectedClients.get(client.id);
    if (clientInfo) {
      clientInfo.rooms.add(room);
    }
    this.logger.log(`Client ${client.id} (${user.email}) joined room: ${room}`);
    client.emit('joinedRoom', { room });
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @MessageBody() room: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(room);
    const clientInfo = this.connectedClients.get(client.id);
    if (clientInfo) {
      clientInfo.rooms.delete(room);
    }
    this.logger.log(`Client ${client.id} left room: ${room}`);
    client.emit('leftRoom', { room });
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

  broadcastToRoom(room: string, event: string, data: any) {
    this.server.to(room).emit(event, data);
    this.logger.debug(`Broadcast to ${room}: ${event}`);
  }

  broadcastToAll(event: string, data: any) {
    this.server.emit(event, data);
    this.logger.debug(`Broadcast to all: ${event}`);
  }
}
