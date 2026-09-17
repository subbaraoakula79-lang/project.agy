import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AdminAuditService } from './admin-audit.service';

@Injectable()
export class AdminVehicleService {
  private readonly logger = new Logger(AdminVehicleService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AdminAuditService,
  ) {}

  /**
   * List vehicles with server-side pagination and filtering.
   */
  async listVehicles(query: {
    page?: number;
    limit?: number;
    vehicleType?: string;
    driverProfileId?: string;
    search?: string;
  }) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    if (query.vehicleType) {
      where.vehicleType = { name: query.vehicleType };
    }

    if (query.driverProfileId) {
      where.driverProfileId = query.driverProfileId;
    }

    if (query.search) {
      const searchTerm = query.search.trim();
      where.registrationNumber = { contains: searchTerm, mode: 'insensitive' };
    }

    const [vehicles, total] = await Promise.all([
      this.prisma.vehicle.findMany({
        where,
        include: {
          vehicleType: true,
          driverProfile: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  phoneNumber: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.vehicle.count({ where }),
    ]);

    return {
      data: vehicles,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get vehicle detail.
   */
  async getVehicleDetail(vehicleId: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: {
        vehicleType: true,
        driverProfile: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                phoneNumber: true,
              },
            },
          },
        },
      },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle not found: ${vehicleId}`);
    }

    return vehicle;
  }

  /**
   * Activate or deactivate a vehicle.
   */
  async updateVehicle(
    vehicleId: string,
    adminUserId: string,
    data: { isActive?: boolean },
  ) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle not found: ${vehicleId}`);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.vehicle.update({
        where: { id: vehicleId },
        data: {
          isActive: data.isActive ?? vehicle.isActive,
        },
        include: { vehicleType: true },
      });

      await this.auditService.createAuditLog(
        {
          adminUserId,
          action: data.isActive ? 'VEHICLE_ACTIVATED' : 'VEHICLE_DEACTIVATED',
          entityType: 'VEHICLE',
          entityId: vehicleId,
          metadata: {
            registrationNumber: vehicle.registrationNumber,
            driverProfileId: vehicle.driverProfileId,
            previousIsActive: vehicle.isActive,
          },
        },
        tx,
      );

      return result;
    });

    this.logger.log(
      `Vehicle ${vehicleId} ${data.isActive ? 'ACTIVATED' : 'DEACTIVATED'} by admin ${adminUserId}`,
    );
    return updated;
  }
}
