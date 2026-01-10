import { Expose } from 'class-transformer';

export class ProductResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  description: string;

  @Expose()
  price: number;

  @Expose()
  image_url: string;

  @Expose()
  available_stock: number;

  @Expose()
  reserved_stock: number;

  @Expose()
  sold_stock: number;

  @Expose()
  created_at: Date;

  @Expose()
  updated_at: Date;
}
