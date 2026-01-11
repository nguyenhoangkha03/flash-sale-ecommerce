import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { Order } from '../orders/entities/order.entity';
import { Reservation } from '../reservations/entities/reservation.entity';
import { Product } from '../products/entities/product.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { RolesGuard } from '../auth/guards/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Order, Reservation, Product, AuditLog])],
  controllers: [AdminController],
  providers: [AdminService, RolesGuard],
})
export class AdminModule {}
