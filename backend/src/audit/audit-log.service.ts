import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

interface LogActionDto {
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async logAction(dto: LogActionDto): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create({
      user_id: dto.userId,
      action: dto.action,
      entity_type: dto.entityType,
      entity_id: dto.entityId,
      details: dto.details,
      ip_address: dto.ipAddress,
      user_agent: dto.userAgent,
    });

    return this.auditLogRepository.save(auditLog);
  }

  async getLogs(limit: number = 50): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      order: { created_at: 'DESC' },
      take: limit,
    });
  }

  async getLogsByEntity(
    entityType: string,
    entityId: string,
  ): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: {
        entity_type: entityType,
        entity_id: entityId,
      },
      order: { created_at: 'DESC' },
    });
  }
}
