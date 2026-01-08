import { User } from 'src/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ReservationItem } from './reservation-item.entity';

export enum ReservationStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  CONVERTED = 'CONVERTED',
  CANCELLED = 'CANCELLED',
}

@Entity('reservations')
export class Reservation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  user_id: string;

  @Index()
  @Column({
    type: 'enum',
    enum: ReservationStatus,
    default: ReservationStatus.ACTIVE,
  })
  status: ReservationStatus;

  @Index()
  @Column({ type: 'timestamp' })
  expires_at: Date;

  @Column({ unique: true, nullable: true })
  idempotency_key: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.reservations)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => ReservationItem, (item) => item.reservation, {
    cascade: true,
  })
  items: ReservationItem[];
}
