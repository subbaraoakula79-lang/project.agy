import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UserRole } from '@yatra-seva/shared-types';
import { CreateSupportTicketDto, UpdateSupportTicketStatusDto } from '../dto/support.dto';

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);

  constructor(private readonly prisma: PrismaService) {}

  private get db(): any {
    return this.prisma as any;
  }

  /**
   * Create a support ticket.
   */
  async createTicket(userId: string, dto: CreateSupportTicketDto) {
    if (dto.rideId) {
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
        throw new ForbiddenException('You are not authorized to link this ride to a support ticket');
      }
    }

    const ticket = await this.db.supportTicket.create({
      data: {
        createdByUserId: userId,
        rideId: dto.rideId || null,
        category: dto.category as any,
        subject: dto.subject,
        description: dto.description,
        priority: (dto.priority as any) || 'MEDIUM',
        status: 'OPEN',
      },
      include: {
        ride: true,
      },
    });

    return ticket;
  }

  /**
   * List tickets for logged-in user.
   */
  async listUserTickets(userId: string, query: { page?: number; limit?: number }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const [tickets, total] = await Promise.all([
      this.db.supportTicket.findMany({
        where: { createdByUserId: userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { ride: true },
      }),
      this.db.supportTicket.count({ where: { createdByUserId: userId } }),
    ]);

    return {
      data: tickets,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single ticket detail.
   */
  async getTicketById(ticketId: string, userId: string, role: string) {
    const ticket = await this.db.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        ride: true,
        createdByUser: { select: { id: true, firstName: true, lastName: true, role: true } },
        resolvedByUser: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!ticket) {
      throw new NotFoundException(`Support ticket ${ticketId} not found`);
    }

    if (role !== UserRole.ADMIN && ticket.createdByUserId !== userId) {
      throw new ForbiddenException('You are not authorized to view this support ticket');
    }

    return ticket;
  }

  /**
   * Admin list support tickets.
   */
  async listAdminTickets(query: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    priority?: string;
  }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.category) where.category = query.category;
    if (query.priority) where.priority = query.priority;

    const [tickets, total] = await Promise.all([
      this.db.supportTicket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          ride: true,
          createdByUser: { select: { id: true, firstName: true, lastName: true, role: true } },
          resolvedByUser: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      this.db.supportTicket.count({ where }),
    ]);

    return {
      data: tickets,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Admin update ticket status.
   */
  async updateTicketStatus(ticketId: string, adminUserId: string, dto: UpdateSupportTicketStatusDto) {
    const ticket = await this.db.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket ${ticketId} not found`);
    }

    const dataToUpdate: any = {
      status: dto.status,
    };

    if (dto.status === 'RESOLVED' || dto.status === 'CLOSED') {
      dataToUpdate.resolvedAt = new Date();
      dataToUpdate.resolvedByUserId = adminUserId;
    }

    const updated = await this.db.supportTicket.update({
      where: { id: ticketId },
      data: dataToUpdate,
    });

    await this.prisma.adminAuditLog.create({
      data: {
        adminUserId,
        action: `SUPPORT_TICKET_${dto.status}`,
        entityType: 'SUPPORT_TICKET',
        entityId: ticketId,
        reason: `Status updated to ${dto.status}`,
      },
    });

    return updated;
  }
}
