import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  ValidationPipe,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { OrderStatus } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { PayOrderDto } from './dto/pay-order.dto';
import { OrderExpirationService } from './order-expiration.service';

@Controller('orders')
export class OrdersController {
  constructor(
    private ordersService: OrdersService,
    private orderExpirationService: OrderExpirationService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createOrder(
    @Body(ValidationPipe) dto: CreateOrderDto,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.createOrder(
      user.userId,
      dto.reservation_id,
      dto.idempotency_key,
    );
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  async getUserOrders(
    @CurrentUser() user: any,
    @Query('status') status?: OrderStatus,
  ) {
    return this.ordersService.getUserOrders(user.userId, status);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getOrder(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.getOrder(id, user.userId);
  }

  @Post(':id/pay')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async payOrder(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(ValidationPipe) dto: PayOrderDto,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.payOrder(id, user.userId, dto.payment_id);
  }

  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async cancelOrder(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: any,
  ) {
    await this.ordersService.cancelOrder(id, user.userId);
    return { message: 'Đơn hàng đã được hủy' };
  }

  @Post(':id/expire')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async manuallyExpireOrder(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: any,
  ) {
    // Only admin can manually expire orders
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Chỉ admin mới có thể hết hạn đơn hàng');
    }

    const result = await this.orderExpirationService.manuallyExpireOrder(id);
    return result;
  }
}
