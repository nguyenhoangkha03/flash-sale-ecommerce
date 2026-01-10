import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';

@Entity('products')
@Check('available_stock >= 0')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ nullable: true })
  image_url: string;

  @Index()
  @Column({ type: 'int', default: 0 })
  available_stock: number;

  @Column({ type: 'int', default: 0 })
  reserved_stock: number;

  @Column({ type: 'int', default: 0 })
  sold_stock: number;

  @VersionColumn({ default: 0 })
  version: number;

  @Index()
  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
