import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reservation } from './entities/reservation.entity';
import { ReservationItem } from './entities/reservation-item.entity';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';
import { Product } from '../products/entities/product.entity';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reservation, ReservationItem, Product]),
    AuditModule,
  ],
  providers: [ReservationsService],
  controllers: [ReservationsController],
  exports: [ReservationsService],
})
export class ReservationsModule {}
