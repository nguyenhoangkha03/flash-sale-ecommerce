import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { OrdersService } from './orders.service';
import { EventsService } from '../events/events.service';

@Injectable()
export class OrderExpirationService {
  private readonly logger = new Logger(OrderExpirationService.name);

  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    private ordersService: OrdersService,
    private eventsService: EventsService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleExpiredPayments(): Promise<void> {
    try {
      this.logger.debug('🔄 Bắt đầu kiểm tra thanh toán hết hạn...');

      // Find orders with expired payment deadline (max 100 per run)
      const now = new Date();
      const expiredOrders = await this.ordersRepository.find({
        where: {
          status: OrderStatus.PENDING_PAYMENT,
          payment_expires_at: LessThanOrEqual(now),
        },
        take: 100,
        relations: ['items'],
      });

      if (expiredOrders.length === 0) {
        this.logger.debug('✓ Không tìm thấy đơn hàng hết hạn');
        return;
      }

      this.logger.log(
        `⏰ Tìm thấy ${expiredOrders.length} đơn hàng hết hạn thanh toán`,
      );

      // Process each expired order
      let successCount = 0;
      let errorCount = 0;

      for (const order of expiredOrders) {
        try {
          // Call the service method that handles expiration properly
          await this.ordersService.expireOrder(order.id);
          successCount++;
          this.logger.log(`✓ Hết hạn thanh toán cho đơn hàng ${order.id}`);

          // Emit event to notify user
          this.eventsService.emitOrderExpired(order.id, order.user_id);
        } catch (error) {
          errorCount++;
          this.logger.error(
            `✗ Lỗi hết hạn đơn hàng ${order.id}: ${error.message}`,
          );
        }
      }

      this.logger.log(
        `📊 Tóm tắt hết hạn: ${successCount} thành công, ${errorCount} thất bại`,
      );
    } catch (error) {
      this.logger.error(
        `💥 Lỗi công việc hết hạn: ${error.message}`,
        error.stack,
      );
    }
  }

  // For testing: manually trigger expiration
  async manuallyExpirePayments(): Promise<{
    expired: number;
    failed: number;
  }> {
    const now = new Date();
    const expiredOrders = await this.ordersRepository.find({
      where: {
        status: OrderStatus.PENDING_PAYMENT,
        payment_expires_at: LessThanOrEqual(now),
      },
    });

    let successCount = 0;
    let errorCount = 0;

    for (const order of expiredOrders) {
      try {
        await this.ordersService.expireOrder(order.id);
        successCount++;
      } catch (error) {
        errorCount++;
      }
    }

    return { expired: successCount, failed: errorCount };
  }

  // Manually expire a specific order (admin action)
  async manuallyExpireOrder(orderId: string): Promise<any> {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error('Không tìm thấy đơn hàng');
    }

    if (order.status !== OrderStatus.PENDING_PAYMENT) {
      throw new Error(
        `Không thể hết hạn đơn hàng với trạng thái: ${order.status}`,
      );
    }

    await this.ordersRepository.update(
      { id: orderId },
      { status: OrderStatus.EXPIRED },
    );

    return {
      message: 'Đơn hàng đã được hết hạn',
      orderId,
      status: OrderStatus.EXPIRED,
    };
  }
}
