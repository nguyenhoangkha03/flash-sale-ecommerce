import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/events',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(EventsGateway.name);
  private connectedClients = new Map<string, Socket>();
  private productViewers = new Map<string, Set<string>>();

  handleConnection(client: Socket) {
    try {
      // Extract JWT token from auth header
      const token = client.handshake.auth.token;
      let userId: string | null = null;

      if (token) {
        try {
          const payload = jwt.decode(token) as any;
          userId = payload?.sub;
        } catch (error) {
          this.logger.warn('Lỗi giải mã JWT');
        }
      }

      if (userId) {
        this.connectedClients.set(userId, client);
        this.logger.log(`✓ Người dùng ${userId} kết nối (${client.id})`);
      } else {
        this.logger.log(`✓ Khách không xác thực kết nối (${client.id})`);
      }

      // Send welcome message
      client.emit('connected', {
        message: 'Kết nối WebSocket thành công',
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error(`Lỗi kết nối: ${error.message}`);
    }
  }

  handleDisconnect(client: Socket) {
    try {
      // Find and remove user by socket
      let userId: string | null = null;
      for (const [uid, socket] of this.connectedClients.entries()) {
        if (socket.id === client.id) {
          userId = uid;
          this.connectedClients.delete(uid);
          break;
        }
      }

      // Remove user from all product viewers
      for (const [productId, viewers] of this.productViewers.entries()) {
        viewers.delete(client.id);
        if (viewers.size === 0) {
          this.productViewers.delete(productId);
        } else {
          this.server.emit('product:viewers', {
            productId,
            viewerCount: viewers.size,
          });
        }
      }

      if (userId) {
        this.logger.log(`✓ Người dùng ${userId} ngắt kết nối`);
      } else {
        this.logger.log(`✓ Khách ngắt kết nối (${client.id})`);
      }
    } catch (error) {
      this.logger.error(`Lỗi ngắt kết nối: ${error.message}`);
    }
  }

  @SubscribeMessage('product:view')
  handleProductView(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { productId: string },
  ) {
    try {
      const { productId } = data;
      if (!productId) return;

      if (!this.productViewers.has(productId)) {
        this.productViewers.set(productId, new Set());
      }

      this.productViewers.get(productId)!.add(client.id);
      const viewerCount = this.productViewers.get(productId)!.size;

      this.logger.log(
        `👁️ Sản phẩm ${productId} đang được xem bởi ${viewerCount} người`,
      );

      this.server.emit('product:viewers', {
        productId,
        viewerCount,
      });
    } catch (error) {
      this.logger.error(`Lỗi tracking product view: ${error.message}`);
    }
  }

  @SubscribeMessage('product:unview')
  handleProductUnview(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { productId: string },
  ) {
    try {
      const { productId } = data;
      if (!productId) return;

      if (this.productViewers.has(productId)) {
        this.productViewers.get(productId)!.delete(client.id);
        const viewerCount = this.productViewers.get(productId)!.size;

        if (viewerCount === 0) {
          this.productViewers.delete(productId);
        }

        this.logger.log(
          `👁️ Sản phẩm ${productId} còn ${viewerCount} người xem`,
        );

        this.server.emit('product:viewers', {
          productId,
          viewerCount,
        });
      }
    } catch (error) {
      this.logger.error(`Lỗi tracking product unview: ${error.message}`);
    }
  }

  // Helper method to broadcast to specific user
  emitToUser(userId: string, event: string, data: any) {
    const client = this.connectedClients.get(userId);
    if (client) {
      client.emit(event, data);
    }
  }

  // Helper method to broadcast to all connected clients
  emitToAll(event: string, data: any) {
    this.server.emit(event, data);
  }
}
