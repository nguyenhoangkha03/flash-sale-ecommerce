import { Injectable, Logger } from '@nestjs/common';
import { EventsGateway } from './events.gateway';

export interface StockChangedEvent {
  productId: string;
  availableStock: number;
  reservedStock: number;
  soldStock: number;
  timestamp: Date;
  sequence?: number;
}

export interface ReservationEvent {
  reservationId: string;
  userId: string;
  items: Array<{
    productId: string;
    quantity: number;
    priceSnapshot: number;
  }>;
  expiresAt: Date;
  timestamp: Date;
}

export interface OrderEvent {
  orderId: string;
  userId: string;
  reservationId: string;
  totalAmount: number;
  status: string;
  expiresAt: Date;
  timestamp: Date;
}

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);
  private eventSequence = 0;

  constructor(private eventsGateway: EventsGateway) {}

  // Get next sequence number
  private getNextSequence(): number {
    return ++this.eventSequence;
  }

  // Emit stock changed event
  emitStockChanged(productId: string, stockData: StockChangedEvent) {
    try {
      this.eventsGateway.emitToAll('stock:changed', {
        ...stockData,
        sequence: this.getNextSequence(),
        timestamp: new Date(),
      });
      this.logger.debug(`📦 Phát sóng thay đổi tồn kho cho sản phẩm ${productId}`);
    } catch (error) {
      this.logger.error(`Lỗi phát sóng tồn kho: ${error.message}`);
    }
  }

  // Emit reservation created event
  emitReservationCreated(reservation: ReservationEvent) {
    try {
      this.eventsGateway.emitToUser(reservation.userId, 'reservation:created', {
        ...reservation,
        timestamp: new Date(),
      });

      // Also broadcast to all connected clients
      this.eventsGateway.emitToAll('reservation:created', {
        reservationId: reservation.reservationId,
        itemsCount: reservation.items.length,
        timestamp: new Date(),
      });

      this.logger.log(`✓ Phát sóng đơn giữ hàng được tạo ${reservation.reservationId}`);
    } catch (error) {
      this.logger.error(`Lỗi phát sóng giữ hàng: ${error.message}`);
    }
  }

  // Emit reservation expired event
  emitReservationExpired(reservationId: string, userId: string) {
    try {
      this.eventsGateway.emitToUser(userId, 'reservation:expired', {
        reservationId,
        timestamp: new Date(),
      });
      this.logger.log(`✓ Phát sóng đơn giữ hàng hết hạn ${reservationId}`);
    } catch (error) {
      this.logger.error(`Lỗi phát sóng hết hạn: ${error.message}`);
    }
  }

  // Emit order created event
  emitOrderCreated(order: OrderEvent) {
    try {
      this.eventsGateway.emitToUser(order.userId, 'order:created', {
        ...order,
        timestamp: new Date(),
      });

      // Also broadcast to all
      this.eventsGateway.emitToAll('order:created', {
        orderId: order.orderId,
        totalAmount: order.totalAmount,
        timestamp: new Date(),
      });

      this.logger.log(`✓ Phát sóng đơn hàng được tạo ${order.orderId}`);
    } catch (error) {
      this.logger.error(`Lỗi phát sóng đơn hàng: ${error.message}`);
    }
  }

  // Emit order paid event
  emitOrderPaid(orderId: string, userId: string, totalAmount: number) {
    try {
      this.eventsGateway.emitToUser(userId, 'order:paid', {
        orderId,
        totalAmount,
        timestamp: new Date(),
      });

      // Also broadcast to all
      this.eventsGateway.emitToAll('order:paid', {
        orderId,
        totalAmount,
        timestamp: new Date(),
      });

      this.logger.log(`✓ Phát sóng đơn hàng được thanh toán ${orderId}`);
    } catch (error) {
      this.logger.error(`Lỗi phát sóng thanh toán: ${error.message}`);
    }
  }

  // Emit order expired event
  emitOrderExpired(orderId: string, userId: string) {
    try {
      this.eventsGateway.emitToUser(userId, 'order:expired', {
        orderId,
        timestamp: new Date(),
      });
      this.logger.log(`✓ Phát sóng đơn hàng hết hạn ${orderId}`);
    } catch (error) {
      this.logger.error(`Lỗi phát sóng hết hạn đơn hàng: ${error.message}`);
    }
  }
}
