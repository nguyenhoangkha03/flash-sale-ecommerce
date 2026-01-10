import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Reservation, ReservationStatus } from './entities/reservation.entity';
import { ReservationsService } from './reservations.service';

@Injectable()
export class ReservationExpirationService {
  private readonly logger = new Logger(ReservationExpirationService.name);

  constructor(
    @InjectRepository(Reservation)
    private reservationsRepository: Repository<Reservation>,
    private reservationsService: ReservationsService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleExpiredReservations(): Promise<void> {
    try {
      this.logger.debug('🔄 Bắt đầu kiểm tra hết hạn....');

      const now = new Date();
      const expiredReservations = await this.reservationsRepository.find({
        where: {
          status: ReservationStatus.ACTIVE,
          expires_at: LessThanOrEqual(now),
        },
        take: 100,
        relations: ['items'],
      });

      if (expiredReservations.length === 0) {
        this.logger.debug('✓ Không tìm thấy reservation nào đã hết hạn.');
        return;
      }

      this.logger.log(
        `⏰ Tìm thấy ${expiredReservations.length} reservations hết hạn`,
      );

      let successCount = 0;
      let errorCount = 0;

      for (const reservation of expiredReservations) {
        try {
          await this.reservationsService.releaseReservation(
            reservation.id,
            undefined,
            true, // isAutoExpired
          );
          successCount++;
          this.logger.log(`✓ Reservation ${reservation.id} tự động hết hạn`);
        } catch (error) {
          errorCount++;
          this.logger.error(
            `✗ Lỗi khi hết hạn reservation ${reservation.id}: ${error.message}`,
          );
        }
      }

      this.logger.log(
        `📊 Tóm tắt kết quả hết hạn: ${successCount} thành công, ${errorCount} thất bại`,
      );
    } catch (error) {
      this.logger.error(
        `💥 Lỗi trong quá trình xử lý công việc hết hạn: ${error.message}`,
        error.stack,
      );
    }
  }

  async manuallyExpireReservations(): Promise<{
    expired: number;
    failed: number;
  }> {
    const now = new Date();
    const expiredReservations = await this.reservationsRepository.find({
      where: {
        status: ReservationStatus.ACTIVE,
        expires_at: LessThanOrEqual(now),
      },
      relations: ['items'],
    });

    let successCount = 0;
    let errorCount = 0;

    for (const reservation of expiredReservations) {
      try {
        await this.reservationsService.releaseReservation(
          reservation.id,
          undefined,
          true,
        );
        successCount++;
      } catch (error) {
        errorCount++;
      }
    }

    return { expired: successCount, failed: errorCount };
  }
}
