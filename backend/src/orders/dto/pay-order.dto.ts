import { IsString } from 'class-validator';

export class PayOrderDto {
  @IsString()
  payment_id: string;
}
