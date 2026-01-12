import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { Order, OrderStatus } from '../orders/entities/order.entity';
import { Reservation, ReservationStatus } from '../reservations/entities/reservation.entity';
import { Product } from '../products/entities/product.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(Reservation)
    private reservationsRepository: Repository<Reservation>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(AuditLog)
    private auditLogsRepository: Repository<AuditLog>,
  ) {}

  async getOrders(
    status?: string,
    search?: string,
    page: number = 1,
    limit: number = 50,
  ) {
    const where: FindOptionsWhere<Order> = {};

    if (status) {
      where.status = status as OrderStatus;
    }

    const skip = (page - 1) * limit;

    const orders = await this.ordersRepository.find({
      where,
      relations: ['user'],
      skip,
      take: limit,
      order: { created_at: 'DESC' },
    });

    return orders.map((order: any) => ({
      ...order,
      user: { email: order.user?.email },
    }));
  }

  async getReservations(
    status?: string,
    page: number = 1,
    limit: number = 50,
  ) {
    const where: FindOptionsWhere<Reservation> = {};

    if (status) {
      where.status = status as ReservationStatus;
    }

    const skip = (page - 1) * limit;

    const reservations = await this.reservationsRepository.find({
      where,
      relations: ['user', 'items'],
      skip,
      take: limit,
      order: { created_at: 'DESC' },
    });

    return reservations.map((res: any) => ({
      ...res,
      user: { email: res.user?.email },
    }));
  }

  async getProducts() {
    return this.productsRepository.find({
      order: { created_at: 'DESC' },
    });
  }

  async getAuditLogs(
    action?: string,
    page: number = 1,
    limit: number = 50,
  ) {
    const where: FindOptionsWhere<AuditLog> = {};

    if (action) {
      where.action = action;
    }

    const skip = (page - 1) * limit;

    const logs = await this.auditLogsRepository.find({
      where,
      relations: ['user'],
      skip,
      take: limit,
      order: { created_at: 'DESC' },
    });

    return logs.map((log: any) => ({
      ...log,
      user: { email: log.user?.email },
    }));
  }
}
