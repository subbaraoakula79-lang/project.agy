import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { UserRole } from '@yatra-seva/shared-types';
import {
  CreateIncidentDto,
  UpdateIncidentStatusDto,
  UpdateIncidentSeverityDto,
} from '../dto/incidents.dto';

@Injectable()
export class IncidentsService {
  private readonly logger = new Logger(IncidentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private get db(): any {
    return this.prisma as any;
  }

  /**
   * Create an incident report for a ride.
   */
  async createIncident(userId: string, dto: CreateIncidentDto) {
    const ride = await this.prisma.ride.findUnique({
      where: { id: dto.rideId },
      include: { driverProfile: true },
    });

    if (!ride) {
      throw new NotFoundException(`Ride ${dto.rideId} not found`);
    }

    const isRider = ride.riderId === userId;
    const isDriver = ride.driverProfile?.userId === userId;

    if (!isRider && !isDriver) {
      throw new ForbiddenException('You are not authorized to report an incident for this ride');
    }

    const incident = await this.db.incident.create({
      data: {
        rideId: dto.rideId,
        reportedByUserId: userId,
        category: dto.category as any,
        severity: (dto.severity as any) || 'MEDIUM',
        description: dto.description,
        status: 'OPEN',
      },
      include: {
        ride: true,
      },
    });

    // Send non-fatal notification for high/critical incidents
    if (dto.severity === 'HIGH' || dto.severity === 'CRITICAL') {
      try {
        await this.notificationsService.createAndSendNotification({
          userId,
          type: 'RIDE_UPDATED' as any,
          title: '⚠️ Incident Report Filed',
          body: `High severity incident reported for ride #${dto.rideId.substring(0, 8)}. Safety team notified.`,
          data: { incidentId: incident.id, rideId: dto.rideId },
        });
      } catch (err: any) {
        this.logger.error(`Non-fatal notification error on incident create: ${err.message}`);
      }
    }

    return incident;
  }

  /**
   * List incidents reported by user.
   */
  async listUserIncidents(userId: string, query: { page?: number; limit?: number }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const [incidents, total] = await Promise.all([
      this.db.incident.findMany({
        where: { reportedByUserId: userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { ride: true },
      }),
      this.db.incident.count({ where: { reportedByUserId: userId } }),
    ]);

    return {
      data: incidents,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single incident detail.
   */
  async getIncidentById(incidentId: string, userId: string, role: string) {
    const incident = await this.db.incident.findUnique({
      where: { id: incidentId },
      include: {
        ride: true,
        reportedByUser: { select: { id: true, firstName: true, lastName: true, role: true } },
        resolvedByUser: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!incident) {
      throw new NotFoundException(`Incident ${incidentId} not found`);
    }

    if (role !== UserRole.ADMIN && incident.reportedByUserId !== userId) {
      throw new ForbiddenException('You are not authorized to view this incident');
    }

    return incident;
  }

  /**
   * Admin list incidents.
   */
  async listAdminIncidents(query: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    severity?: string;
  }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.category) where.category = query.category;
    if (query.severity) where.severity = query.severity;

    const [incidents, total] = await Promise.all([
      this.db.incident.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          ride: true,
          reportedByUser: { select: { id: true, firstName: true, lastName: true, role: true } },
          resolvedByUser: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      this.db.incident.count({ where }),
    ]);

    return {
      data: incidents,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Admin update incident status.
   */
  async updateIncidentStatus(
    incidentId: string,
    adminUserId: string,
    dto: UpdateIncidentStatusDto,
  ) {
    const incident = await this.db.incident.findUnique({
      where: { id: incidentId },
    });

    if (!incident) {
      throw new NotFoundException(`Incident ${incidentId} not found`);
    }

    const dataToUpdate: any = {
      status: dto.status,
    };

    if (dto.status === 'RESOLVED' || dto.status === 'CLOSED') {
      dataToUpdate.resolvedAt = new Date();
      dataToUpdate.resolvedByUserId = adminUserId;
    }

    const updated = await this.db.incident.update({
      where: { id: incidentId },
      data: dataToUpdate,
    });

    await this.prisma.adminAuditLog.create({
      data: {
        adminUserId,
        action: `INCIDENT_${dto.status}`,
        entityType: 'INCIDENT',
        entityId: incidentId,
        reason: `Incident status updated to ${dto.status}`,
      },
    });

    return updated;
  }

  /**
   * Admin update incident severity.
   */
  async updateIncidentSeverity(
    incidentId: string,
    adminUserId: string,
    dto: UpdateIncidentSeverityDto,
  ) {
    const incident = await this.db.incident.findUnique({
      where: { id: incidentId },
    });

    if (!incident) {
      throw new NotFoundException(`Incident ${incidentId} not found`);
    }

    const updated = await this.db.incident.update({
      where: { id: incidentId },
      data: { severity: dto.severity as any },
    });

    await this.prisma.adminAuditLog.create({
      data: {
        adminUserId,
        action: `INCIDENT_SEVERITY_UPDATED`,
        entityType: 'INCIDENT',
        entityId: incidentId,
        reason: `Severity updated to ${dto.severity}`,
      },
    });

    return updated;
  }
}
