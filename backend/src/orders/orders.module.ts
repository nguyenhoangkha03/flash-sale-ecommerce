import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { OrderExpirationService } from './order-expiration.service';
import { Reservation } from '../reservations/entities/reservation.entity';
import { ReservationItem } from '../reservations/entities/reservation-item.entity';
import { Product } from '../products/entities/product.entity';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderItem,
      Reservation,
      ReservationItem,
      Product,
    ]),
    AuditModule,
  ],
  providers: [OrdersService, OrderExpirationService],
  controllers: [OrdersController],
  exports: [OrdersService, TypeOrmModule],
})
export class OrdersModule {}
