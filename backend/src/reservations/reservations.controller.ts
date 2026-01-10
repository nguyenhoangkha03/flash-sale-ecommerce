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
import { CreateReservationDto } from './dto/create-reservation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ReservationStatus } from './entities/reservation.entity';

@Controller('reservations')
export class ReservationsController {
  constructor(private reservationsService: ReservationsService) {}

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
}
