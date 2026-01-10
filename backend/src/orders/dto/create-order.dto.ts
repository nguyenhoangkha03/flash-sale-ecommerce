import { IsUUID, IsOptional, IsString } from 'class-validator';

export class CreateOrderDto {
  @IsUUID()
  reservation_id: string;

  @IsOptional()
  @IsString()
  idempotency_key?: string;
}
