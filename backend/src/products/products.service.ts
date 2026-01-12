import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AuditLogService } from '../audit/audit-log.service';
import { PaginationMeta } from '../common/interfaces/pagination-meta.interface';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    private auditLogService: AuditLogService,
  ) {}

  async findAll(filters: {
    page?: number;
    limit?: number;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    sort?: string;
  }): Promise<{ data: Product[]; meta: PaginationMeta }> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    let query = this.productsRepository.createQueryBuilder('product');

    // Apply filters
    if (filters.minPrice !== undefined) {
      query = query.andWhere('product.price >= :minPrice', {
        minPrice: filters.minPrice,
      });
    }

    if (filters.maxPrice !== undefined) {
      query = query.andWhere('product.price <= :maxPrice', {
        maxPrice: filters.maxPrice,
      });
    }

    if (filters.inStock === true) {
      query = query.andWhere('product.available_stock > 0');
    }

    // Sort
    const sortOrder = filters.sort === 'asc' ? 'ASC' : 'DESC';
    query = query.orderBy('product.created_at', sortOrder);

    // Pagination
    const [data, total] = await query.skip(skip).take(limit).getManyAndCount();

    const meta: PaginationMeta = {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };

    return { data, meta };
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Sản phẩm với ID ${id} không tìm thấy!`);
    }

    return product;
  }

  async create(dto: CreateProductDto, userId: string): Promise<Product> {
    if (!dto.name || dto.name.trim() === '') {
      throw new BadRequestException('Tên sản phẩm là bắt buộc!');
    }

    if (dto.price < 0) {
      throw new BadRequestException('Giá phải lớn hơn hoặc bằng 0!');
    }

    if (dto.available_stock < 0) {
      throw new BadRequestException(
        'Số lượng hàng tồn kho phải lớn hơn hoặc bằng 0!',
      );
    }

    const product = this.productsRepository.create({
      name: dto.name,
      description: dto.description,
      price: dto.price,
      image_url: dto.image_url,
      available_stock: dto.available_stock,
      reserved_stock: 0,
      sold_stock: 0,
    });

    const savedProduct = await this.productsRepository.save(product);

    // Log audit
    await this.auditLogService.logAction({
      userId,
      action: 'PRODUCT_CREATED',
      entityType: 'Product',
      entityId: savedProduct.id,
      details: {
        name: savedProduct.name,
        price: savedProduct.price,
        stock: savedProduct.available_stock,
      },
    });

    return savedProduct;
  }

  async update(
    id: string,
    dto: UpdateProductDto,
    userId: string,
  ): Promise<Product> {
    const product = await this.findOne(id);

    const dtoAny = dto as any;
    if (dtoAny.price !== undefined && dtoAny.price < 0) {
      throw new BadRequestException('Giá phải lớn hơn hoặc bằng 0!');
    }

    if (dtoAny.available_stock !== undefined && dtoAny.available_stock < 0) {
      throw new BadRequestException(
        'Số lượng hàng tồn kho phải lớn hơn hoặc bằng 0!',
      );
    }

    Object.assign(product, dto);
    const updatedProduct = await this.productsRepository.save(product);

    // Log audit
    await this.auditLogService.logAction({
      userId,
      action: 'PRODUCT_UPDATED',
      entityType: 'Product',
      entityId: id,
      details: {
        changes: dto,
      },
    });

    return updatedProduct;
  }

  async remove(id: string, userId: string): Promise<void> {
    const product = await this.findOne(id);

    // Check: không có reservation/order đang active
    // Todo later

    // Log audit
    await this.auditLogService.logAction({
      userId,
      action: 'PRODUCT_DELETED',
      entityType: 'Product',
      entityId: id,
      details: {
        name: product.name,
        price: product.price,
      },
    });

    // Hard delete
    await this.productsRepository.remove(product);
  }

  async getStockInfo(id: string): Promise<{
    productId: string;
    name: string;
    totalStock: number;
    availableStock: number;
    reservedStock: number;
    soldStock: number;
  }> {
    const product = await this.findOne(id);

    return {
      productId: product.id,
      name: product.name,
      totalStock:
        product.available_stock + product.reserved_stock + product.sold_stock,
      availableStock: product.available_stock,
      reservedStock: product.reserved_stock,
      soldStock: product.sold_stock,
    };
  }
}
