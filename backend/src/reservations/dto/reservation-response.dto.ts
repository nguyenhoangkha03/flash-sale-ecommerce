import { Expose, Type } from 'class-transformer';
import { ReservationStatus } from '../entities/reservation.entity';

export class ReservationItemResponseDto {
  @Expose()
  id: string;

  @Expose()
  product_id: string;

  @Expose()
  quantity: number;

  @Expose()
  price_snapshot: number;
}

export class ReservationResponseDto {
  @Expose()
  id: string;

  @Expose()
  user_id: string;

  @Expose()
  status: ReservationStatus;

  @Expose()
  expires_at: Date;

  @Expose()
  @Type(() => ReservationItemResponseDto)
  items: ReservationItemResponseDto[];

  @Expose()
  created_at: Date;

  @Expose()
  updated_at: Date;

  // Computed field: remaining TTL in seconds
  @Expose()
  get remainingTtl(): number {
    return Math.max(0, Math.floor((this.expires_at.getTime() - Date.now()) / 1000));
  }

  // Computed field: total value
  @Expose()
  get totalValue(): number {
    return this.items?.reduce((sum, item) => sum + item.price_snapshot * item.quantity, 0) || 0;
  }
}
