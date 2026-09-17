import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AdminAuditService } from './admin-audit.service';
import { PaginationQueryDto, UpdateCityDto } from '../dto/admin.dto';

@Injectable()
export class AdminCityService {
  private readonly logger = new Logger(AdminCityService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AdminAuditService,
  ) {}

  async listCities(query: PaginationQueryDto) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;

    const [cities, total] = await Promise.all([
      this.prisma.city.findMany({
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          pricingConfigs: {
            include: {
              vehicleType: true,
            },
          },
          _count: {
            select: {
              driverProfiles: true,
              rides: true,
            },
          },
        },
      }),
      this.prisma.city.count(),
    ]);

    return {
      cities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getCityDetail(id: string) {
    const city = await this.prisma.city.findUnique({
      where: { id },
      include: {
        pricingConfigs: {
          include: {
            vehicleType: true,
          },
        },
        _count: {
          select: {
            driverProfiles: true,
            rides: true,
          },
        },
      },
    });

    if (!city) {
      throw new NotFoundException(`City with ID ${id} not found`);
    }

    return city;
  }

  async updateCity(id: string, dto: UpdateCityDto, adminUserId: string) {
    const existing = await this.prisma.city.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`City with ID ${id} not found`);
    }

    const previousState = {
      isActive: existing.isActive,
    };

    const updated = await this.prisma.$transaction(async (tx) => {
      const city = await tx.city.update({
        where: { id },
        data: {
          isActive: dto.isActive !== undefined ? dto.isActive : existing.isActive,
        },
      });

      await this.auditService.createAuditLog(
        {
          adminUserId,
          action: 'CITY_UPDATED',
          entityType: 'CITY',
          entityId: id,
          reason: dto.isActive !== undefined ? `Active status changed to ${dto.isActive}` : 'City configuration updated',
          metadata: {
            previousState,
            newState: {
              isActive: city.isActive,
            },
          },
        },
        tx,
      );

      return city;
    });

    this.logger.log(`City ${id} updated by admin ${adminUserId}`);
    return updated;
  }
}
