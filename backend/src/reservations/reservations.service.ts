import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, LessThanOrEqual, In } from 'typeorm';
import { Reservation, ReservationStatus } from './entities/reservation.entity';
import { ReservationItem } from './entities/reservation-item.entity';
import { Product } from '../products/entities/product.entity';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { AuditLogService } from '../audit/audit-log.service';
import { EventsService } from '../events/events.service';

const RESERVATION_TTL_MINUTES = 10;

@Injectable()
export class ReservationsService {
  constructor(
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

  async createReservation(
    userId: string,
    dto: CreateReservationDto,
  ): Promise<Reservation> {
    // Kiểm tra Idempotency
    if (dto.idempotency_key) {
      const existingReservation = await this.reservationsRepository.findOne({
        where: { idempotency_key: dto.idempotency_key },
      });

      if (existingReservation) {
        if (existingReservation.status === ReservationStatus.ACTIVE) {
          return this.getReservationWithItems(existingReservation.id);
        } else {
          throw new BadRequestException(
            'Không thể sử dụng lại khóa định danh duy nhất!',
          );
        }
      }
    }

    // Bắt đầu transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Lock và validate sản phẩm
      const productIds = dto.items.map((item) => item.productId);
      const products = await queryRunner.manager.find(Product, {
        where: { id: In(productIds) },
        lock: { mode: 'pessimistic_write' },
      });

      if (products.length !== productIds.length) {
        throw new BadRequestException('Một số sản phẩm không được tìm thấy!');
      }

      // Kiểm tra tồn
      const itemMap = new Map(
        dto.items.map((item) => [item.productId, item.quantity]),
      );
      for (const product of products) {
        const requestedQty = itemMap.get(product.id) || 0;
        if (product.available_stock < requestedQty) {
          throw new BadRequestException(
            `Không đủ hàng cho sản phẩm ${product.id}. 
            Tồn kho hiện tại: ${product.available_stock}, 
            Số lượng yêu cầu: ${requestedQty}`,
          );
        }
      }

      // Trừ hàng tồn
      for (const product of products) {
        const requestedQty = itemMap.get(product.id) || 0;
        await queryRunner.manager.update(
          Product,
          { id: product.id },
          {
            available_stock: product.available_stock - requestedQty,
            reserved_stock: product.reserved_stock + requestedQty,
          },
        );
      }

      // Tạo Reservation
      const expiresAt = new Date(
        Date.now() + RESERVATION_TTL_MINUTES * 60 * 1000,
      );
      const reservation = this.reservationsRepository.create({
        user_id: userId,
        status: ReservationStatus.ACTIVE,
        expires_at: expiresAt,
        idempotency_key: dto.idempotency_key,
      });

      const savedReservation = await queryRunner.manager.save(
        Reservation,
        reservation,
      );

      // Tạo ReservationItems
      const reservationItems = dto.items.map((item) => {
        const product = products.find((p) => p.id === item.productId);
        return this.reservationItemsRepository.create({
          reservation_id: savedReservation.id,
          product_id: item.productId,
          quantity: item.quantity,
          price_snapshot: Number(product?.price || 0),
        });
      });

      await queryRunner.manager.save(ReservationItem, reservationItems);

      // Log Audit
      const totalValue = reservationItems.reduce(
        (sum, item) => sum + item.price_snapshot * item.quantity,
        0,
      );

      await this.auditLogService.logAction({
        userId,
        action: 'RESERVATION_CREATED',
        entityType: 'Reservation',
        entityId: savedReservation.id,
        details: {
          items: dto.items,
          totalValue,
          expiresAt,
        },
      });

      // Commit
      await queryRunner.commitTransaction();

      // Emit stock changed events for all products
      for (const product of products) {
        const requestedQty = itemMap.get(product.id) || 0;
        const updatedProduct = await this.productsRepository.findOne({
          where: { id: product.id },
        });

        if (updatedProduct) {
          this.eventsService.emitStockChanged(product.id, {
            productId: product.id,
            availableStock: updatedProduct.available_stock,
            reservedStock: updatedProduct.reserved_stock,
            soldStock: updatedProduct.sold_stock,
            timestamp: new Date(),
          });
        }
      }

      // Emit reservation created event
      const reservationWithItems = await this.getReservationWithItems(savedReservation.id);
      this.eventsService.emitReservationCreated({
        reservationId: savedReservation.id,
        userId,
        items: reservationWithItems.items.map(item => ({
          productId: item.product_id,
          quantity: item.quantity,
          priceSnapshot: item.price_snapshot,
        })),
        expiresAt: reservationWithItems.expires_at,
        timestamp: new Date(),
      });

      // Trả lại toàn bộ reservation bao gồm cả các mặt hàng đã đặt.
      return reservationWithItems;
    } catch (error) {
      // Rollback nếu lỗi
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async releaseReservation(
    reservationId: string,
    userId?: string,
    isAutoExpired: boolean = false,
  ): Promise<void> {
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

      if (
        reservation.status !== ReservationStatus.ACTIVE &&
        reservation.status !== ReservationStatus.EXPIRED
      ) {
        throw new BadRequestException(
          `Không thể hủy reservation với trạng thái hiện tại: ${reservation.status}`,
        );
      }

      // Load items
      const items = await queryRunner.manager.find(ReservationItem, {
        where: { reservation_id: reservationId },
      });

      // Khôi phục kho
      for (const item of items) {
        const product = await queryRunner.manager.findOne(Product, {
          where: { id: item.product_id },
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

      // Cập nhật trạng thái Reservation
      const newStatus = isAutoExpired
        ? ReservationStatus.EXPIRED
        : ReservationStatus.CANCELLED;

      await queryRunner.manager.update(
        Reservation,
        { id: reservationId },
        { status: newStatus },
      );

      // Log Audit
      await this.auditLogService.logAction({
        userId,
        action: 'RESERVATION_RELEASED',
        entityType: 'Reservation',
        entityId: reservationId,
        details: {
          previousStatus: reservation.status,
          isAutoExpired,
        },
      });

      // Commit
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getReservationWithItems(id: string): Promise<Reservation> {
    const reservation = await this.reservationsRepository.findOne({
      where: { id },
      relations: ['items'],
    });

    if (!reservation) {
      throw new NotFoundException('Không tìm thấy Reservation');
    }

    return reservation;
  }

  async getUserReservations(
    userId: string,
    status?: ReservationStatus,
  ): Promise<Reservation[]> {
    const query = this.reservationsRepository
      .createQueryBuilder('r')
      .where('r.user_id = :userId', { userId })
      .leftJoinAndSelect('r.items', 'items')
      .orderBy('r.created_at', 'DESC');

    if (status) {
      query.andWhere('r.status = :status', { status });
    }

    return query.getMany();
  }

  async getReservation(id: string, userId?: string): Promise<Reservation> {
    const reservation = await this.getReservationWithItems(id);

    if (userId && reservation.user_id !== userId) {
      throw new BadRequestException('Không thể truy cập reservation này!');
    }

    return reservation;
  }

  async expireReservations(): Promise<number> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const now = new Date();
      const expiredReservations = await queryRunner.manager.find(Reservation, {
        where: {
          status: ReservationStatus.ACTIVE,
          expires_at: LessThanOrEqual(now),
        },
        relations: ['items'],
      });

      // Khôi phục tồn
      for (const reservation of expiredReservations) {
        for (const item of reservation.items) {
          const product = await queryRunner.manager.findOne(Product, {
            where: { id: item.product_id },
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

        // Cập nhật trạng thái
        await queryRunner.manager.update(
          Reservation,
          { id: reservation.id },
          { status: ReservationStatus.EXPIRED },
        );

        // Log
        await this.auditLogService.logAction({
          action: 'RESERVATION_EXPIRED',
          entityType: 'Reservation',
          entityId: reservation.id,
          details: { expiresAt: reservation.expires_at },
        });
      }

      await queryRunner.commitTransaction();
      return expiredReservations.length;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
