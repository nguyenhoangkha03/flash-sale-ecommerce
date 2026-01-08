import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  user_id: string;

  @Index()
  @Column()
  action: string;

  @Index()
  @Column()
  entity_type: string;

  @Column({ nullable: true })
  entity_id: string;

  @Column({ type: 'jsonb', nullable: true })
  details: any;

  @Column({ nullable: true })
  ip_address: string;

  @Column({ nullable: true })
  user_agent: string;

  @Index()
  @CreateDateColumn()
  created_at: Date;
}
