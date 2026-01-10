import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  IsNotEmpty,
  IsInt,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsString()
  @IsOptional()
  image_url?: string;

  @IsInt()
  @Min(0)
  available_stock: number;
}
