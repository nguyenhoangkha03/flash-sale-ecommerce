import { IsString, IsOptional, IsArray, ValidateNested, IsUUID, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ReservationItemDto {
  @IsUUID()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateReservationDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReservationItemDto)
  items: ReservationItemDto[];

  @IsString()
  @IsOptional()
  idempotency_key?: string;
}
