import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Reservation, ReservationStatus } from '../reservations/entities/reservation.entity';
import { ReservationItem } from '../reservations/entities/reservation-item.entity';
import { Product } from '../products/entities/product.entity';
import { AuditLogService } from '../audit/audit-log.service';
import { EventsService } from '../events/events.service';

const PAYMENT_TTL_MINUTES = 5;

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemsRepository: Repository<OrderItem>,
    @InjectRepository(Reservation)
    private reservationsRepository: Repository<Reservation>,
    @InjectRepository(ReservationItem)
    private reservationItemsRepository: Repository<ReservationItem>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    private auditLogService: AuditLogService,
    private eventsService: EventsService,
    private dataSource: DataSource,
  ) {}

  async createOrder(
    userId: string,
    reservationId: string,
    idempotencyKey?: string,
  ): Promise<Order> {
    // Kiểm tra Idempotency
    if (idempotencyKey) {
      const existingOrder = await this.ordersRepository.findOne({
        where: { idempotency_key: idempotencyKey },
      });

      if (existingOrder) {
        if (existingOrder.status === OrderStatus.PENDING_PAYMENT) {
          return this.getOrderWithItems(existingOrder.id);
        } else {
          throw new BadRequestException(
            'Không thể sử dụng lại khóa định danh duy nhất!',
          );
        }
      }
    }

    // Kiểm tra nếu đã tồn tại order cho reservation này
    const existingOrder = await this.ordersRepository.findOne({
      where: { reservation_id: reservationId },
    });

    if (existingOrder) {
      return this.getOrderWithItems(existingOrder.id);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Lock Reservation
      const reservation = await queryRunner.manager.findOne(Reservation, {
        where: { id: reservationId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!reservation) {
        throw new NotFoundException('Reservation không tìm thấy!');
      }

      if (reservation.user_id !== userId) {
        throw new BadRequestException('Bạn không sở hữu reservation này!');
      }

      if (reservation.status !== ReservationStatus.ACTIVE) {
        throw new BadRequestException(
          `Không thể tạo order từ reservation với trạng thái: ${reservation.status}`,
        );
      }

      if (new Date(reservation.expires_at) < new Date()) {
        throw new BadRequestException(
          'Reservation đã hết hạn!',
        );
      }

      // Get reservation items
      const reservationItems = await queryRunner.manager.find(ReservationItem, {
        where: { reservation_id: reservationId },
      });

      // Calculate total amount
      const totalAmount = reservationItems.reduce(
        (sum, item) => sum + item.price_snapshot * item.quantity,
        0,
      );

      // Create Order
      const paymentExpiresAt = new Date(
        Date.now() + PAYMENT_TTL_MINUTES * 60 * 1000,
      );

      const order = this.ordersRepository.create({
        user_id: userId,
        reservation_id: reservationId,
        status: OrderStatus.PENDING_PAYMENT,
        total_amount: totalAmount,
        payment_expires_at: paymentExpiresAt,
        idempotency_key: idempotencyKey,
      });

      const savedOrder = await queryRunner.manager.save(Order, order);

      // Create OrderItems from ReservationItems
      const orderItems = reservationItems.map((item) =>
        this.orderItemsRepository.create({
          order_id: savedOrder.id,
          product_id: item.product_id,
          quantity: item.quantity,
          price_snapshot: item.price_snapshot,
        }),
      );

      await queryRunner.manager.save(OrderItem, orderItems);

      // Update Reservation Status
      await queryRunner.manager.update(
        Reservation,
        { id: reservationId },
        { status: ReservationStatus.CONVERTED },
      );

      // Log Audit
      await this.auditLogService.logAction({
        userId,
        action: 'ORDER_CREATED',
        entityType: 'Order',
        entityId: savedOrder.id,
        details: {
          reservationId,
          items: reservationItems.length,
          totalAmount,
        },
      });

      await queryRunner.commitTransaction();

      // Emit order created event
      const createdOrder = await this.getOrderWithItems(savedOrder.id);
      this.eventsService.emitOrderCreated({
        orderId: createdOrder.id,
        userId,
        reservationId,
        totalAmount,
        status: createdOrder.status,
        expiresAt: createdOrder.payment_expires_at,
        timestamp: new Date(),
      });

      return createdOrder;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async payOrder(
    orderId: string,
    userId: string,
    paymentId: string,
  ): Promise<Order> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Lock Order
      const order = await queryRunner.manager.findOne(Order, {
        where: { id: orderId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!order) {
        throw new NotFoundException('Order không tìm thấy!');
      }

      if (order.user_id !== userId) {
        throw new BadRequestException('Bạn không sở hữu order này!');
      }

      // Idempotency: if already paid with same payment_id
      if (order.status === OrderStatus.PAID && order.payment_id === paymentId) {
        return this.getOrderWithItems(orderId);
      }

      if (order.status !== OrderStatus.PENDING_PAYMENT) {
        throw new BadRequestException(
          `Không thể thanh toán order với trạng thái: ${order.status}`,
        );
      }

      if (new Date(order.payment_expires_at) < new Date()) {
        throw new BadRequestException('Thanh toán đã hết hạn!');
      }

      // Mock payment processing
      // In production, integrate with real payment gateway
      const paymentSuccess = Math.random() < 0.95; // 95% success rate for testing
      if (!paymentSuccess) {
        throw new BadRequestException('Thanh toán thất bại. Vui lòng thử lại.');
      }

      // Get order items
      const orderItems = await queryRunner.manager.find(OrderItem, {
        where: { order_id: orderId },
      });

      // Convert reserved → sold stock
      for (const item of orderItems) {
        const product = await queryRunner.manager.findOne(Product, {
          where: { id: item.product_id },
          lock: { mode: 'pessimistic_write' },
        });

        if (product) {
          await queryRunner.manager.update(
            Product,
            { id: item.product_id },
            {
              reserved_stock: product.reserved_stock - item.quantity,
              sold_stock: product.sold_stock + item.quantity,
            },
          );
        }
      }

      // Update Order
      await queryRunner.manager.update(
        Order,
        { id: orderId },
        {
          status: OrderStatus.PAID,
          payment_id: paymentId,
          paid_at: new Date(),
        },
      );

      // Log Audit
      await this.auditLogService.logAction({
        userId,
        action: 'ORDER_PAID',
        entityType: 'Order',
        entityId: orderId,
        details: {
          paymentId,
          amount: order.total_amount,
        },
      });

      await queryRunner.commitTransaction();

      // Emit stock changed events for all products (reserved → sold)
      const paidOrderItems = await this.orderItemsRepository.find({
        where: { order_id: orderId },
      });

      for (const item of paidOrderItems) {
        const updatedProduct = await this.productsRepository.findOne({
          where: { id: item.product_id },
        });

        if (updatedProduct) {
          this.eventsService.emitStockChanged(item.product_id, {
            productId: item.product_id,
            availableStock: updatedProduct.available_stock,
            reservedStock: updatedProduct.reserved_stock,
            soldStock: updatedProduct.sold_stock,
            timestamp: new Date(),
          });
        }
      }

      return this.getOrderWithItems(orderId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async cancelOrder(orderId: string, userId: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Lock Order
      const order = await queryRunner.manager.findOne(Order, {
        where: { id: orderId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!order) {
        throw new NotFoundException('Order không tìm thấy!');
      }

      if (order.user_id !== userId) {
        throw new BadRequestException('Bạn không sở hữu order này!');
      }

      if (order.status !== OrderStatus.PENDING_PAYMENT) {
        throw new BadRequestException(
          `Không thể hủy order với trạng thái: ${order.status}`,
        );
      }

      // Get reservation
      const reservation = await queryRunner.manager.findOne(Reservation, {
        where: { id: order.reservation_id },
      });

      if (reservation && reservation.status === ReservationStatus.CONVERTED) {
        // Restore reserved stock
        const orderItems = await queryRunner.manager.find(OrderItem, {
          where: { order_id: orderId },
        });

        for (const item of orderItems) {
          const product = await queryRunner.manager.findOne(Product, {
            where: { id: item.product_id },
            lock: { mode: 'pessimistic_write' },
          });

          if (product) {
            await queryRunner.manager.update(
              Product,
              { id: item.product_id },
              {
                available_stock: product.available_stock + item.quantity,
                reserved_stock: product.reserved_stock - item.quantity,
              },
            );
          }
        }

        // Reset reservation status back to ACTIVE
        await queryRunner.manager.update(
          Reservation,
          { id: order.reservation_id },
          { status: ReservationStatus.ACTIVE },
        );
      }

      // Update Order status
      await queryRunner.manager.update(
        Order,
        { id: orderId },
        { status: OrderStatus.CANCELLED },
      );

      // Log Audit
      await this.auditLogService.logAction({
        userId,
        action: 'ORDER_CANCELLED',
        entityType: 'Order',
        entityId: orderId,
        details: {},
      });

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getOrderWithItems(id: string): Promise<Order> {
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: ['items'],
    });

    if (!order) {
      throw new NotFoundException('Không tìm thấy Order');
    }

    return order;
  }

  async getUserOrders(userId: string, status?: OrderStatus): Promise<Order[]> {
    const where: any = { user_id: userId };
    if (status) {
      where.status = status;
    }

    return this.ordersRepository.find({
      where,
      relations: ['items'],
      order: { created_at: 'DESC' },
    });
  }

  async getOrder(id: string, userId: string): Promise<Order> {
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: ['items'],
    });

    if (!order) {
      throw new NotFoundException('Order không tìm thấy!');
    }

    if (order.user_id !== userId) {
      throw new BadRequestException('Bạn không sở hữu order này!');
    }

    return order;
  }
}
