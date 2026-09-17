import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PaginationQueryDto } from '../dto/admin.dto';

export interface CreateAuditLogParams {
  adminUserId: string;
  action: string;
  entityType: string;
  entityId: string;
  reason?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class AdminAuditService {
  private readonly logger = new Logger(AdminAuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create an audit log entry. Used internally by other admin services.
   * Supports both standalone and transactional usage.
   */
  async createAuditLog(params: CreateAuditLogParams, tx?: any) {
    const db = tx || this.prisma;
    const log = await db.adminAuditLog.create({
      data: {
        adminUserId: params.adminUserId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        reason: params.reason ?? null,
        metadata: params.metadata ?? null,
      },
    });
    this.logger.log(`Audit: ${params.action} on ${params.entityType}:${params.entityId} by admin ${params.adminUserId}`);
    return log;
  }

  /**
   * List audit logs with pagination and filtering.
   * Append-only: no update/delete endpoints exist.
   */
  async listAuditLogs(query: {
    page?: number;
    limit?: number;
    action?: string;
    entityType?: string;
    adminUserId?: string;
  }) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.action) where.action = query.action;
    if (query.entityType) where.entityType = query.entityType;
    if (query.adminUserId) where.adminUserId = query.adminUserId;

    const [logs, total] = await Promise.all([
      this.prisma.adminAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.adminAuditLog.count({ where }),
    ]);

    return {
      data: logs,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
