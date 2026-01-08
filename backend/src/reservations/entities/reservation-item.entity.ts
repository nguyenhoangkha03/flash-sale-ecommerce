import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Reservation } from './reservation.entity';
import { Product } from 'src/products/entities/product.entity';

@Entity('reservation_items')
export class ReservationItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  reservation_id: string;

  @Column()
  product_id: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price_snapshot: number;

  @CreateDateColumn()
  created_at: Date;

  // Relations
  @ManyToOne(() => Reservation, (reservation) => reservation.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'reservation_id' })
  reservation: Reservation;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
