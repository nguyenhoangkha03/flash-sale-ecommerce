import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  ValidationPipe,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { ReservationExpirationService } from './reservation-expiration.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ReservationStatus } from './entities/reservation.entity';

@Controller('reservations')
export class ReservationsController {
  constructor(
    private reservationsService: ReservationsService,
    private expirationService: ReservationExpirationService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createReservation(
    @Body(ValidationPipe) dto: CreateReservationDto,
    @CurrentUser() user: any,
  ) {
    return this.reservationsService.createReservation(user.userId, dto);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  async getUserReservations(
    @CurrentUser() user: any,
    @Query('status') status?: ReservationStatus,
  ) {
    return this.reservationsService.getUserReservations(user.userId, status);
  }

  @Get('user/active')
  @UseGuards(JwtAuthGuard)
  async getUserActiveReservations(@CurrentUser() user: any) {
    return this.reservationsService.getUserReservations(
      user.userId,
      ReservationStatus.ACTIVE,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getReservation(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: any,
  ) {
    return this.reservationsService.getReservation(id, user.userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async cancelReservation(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: any,
  ) {
    const reservation = await this.reservationsService.getReservation(
      id,
      user.userId,
    );

    if (reservation.status !== 'ACTIVE') {
      throw new Error('Không thể hủy reservation không còn hiệu lực.');
    }

    await this.reservationsService.releaseReservation(id, user.userId);
    return { message: 'Hủy Reservation' };
  }

  @Post(':id/expire')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async manuallyExpireReservation(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: any,
  ) {
    if (user.role !== 'ADMIN') {
      throw new Error('Chỉ admin mới có thể hết hạn reservation');
    }

    await this.reservationsService.releaseReservation(
      id,
      user.userId,
      true, // isAutoExpired
    );
    return { message: 'Reservation đã được hết hạn' };
  }

  @Post('admin/expire-all')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async triggerExpirationJob(@CurrentUser() user: any) {
    if (user.role !== 'ADMIN') {
      throw new Error('Chỉ admin mới có thể trigger expiration job');
    }

    const result = await this.expirationService.manuallyExpireReservations();
    return {
      message: 'Expiration job đã chạy',
      expired: result.expired,
      failed: result.failed,
    };
  }
}
