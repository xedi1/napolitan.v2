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

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/orders',
})
export class OrdersGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(OrdersGateway.name);
  private connectedClients = new Map<string, { socket: Socket; rooms: Set<string> }>();

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    this.connectedClients.set(client.id, { socket: client, rooms: new Set() });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.connectedClients.delete(client.id);
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() room: string,
    @ConnectedSocket() client: Socket,
  ) {
    const validRooms = ['kitchen', 'cashier', 'dashboard'];
    if (!validRooms.includes(room)) {
      client.emit('error', { message: `Invalid room: ${room}` });
      return;
    }

    client.join(room);
    const clientInfo = this.connectedClients.get(client.id);
    if (clientInfo) {
      clientInfo.rooms.add(room);
    }
    this.logger.log(`Client ${client.id} joined room: ${room}`);
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

  broadcastToRoom(room: string, event: string, data: any) {
    this.server.to(room).emit(event, data);
    this.logger.debug(`Broadcast to ${room}: ${event}`);
  }

  broadcastToAll(event: string, data: any) {
    this.server.emit(event, data);
    this.logger.debug(`Broadcast to all: ${event}`);
  }
}
