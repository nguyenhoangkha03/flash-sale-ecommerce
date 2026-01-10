import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reservation } from './entities/reservation.entity';
import { ReservationItem } from './entities/reservation-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Reservation, ReservationItem])],
  exports: [TypeOrmModule],
})
export class ReservationsModule {}
