import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AdminAuditService } from './admin-audit.service';
import { PaginationQueryDto, UpdatePricingDto } from '../dto/admin.dto';

export class ListPricingQueryDto extends PaginationQueryDto {
  cityId?: string;
  vehicleTypeId?: string;
}

@Injectable()
export class AdminPricingService {
  private readonly logger = new Logger(AdminPricingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AdminAuditService,
  ) {}

  async listPricingConfigs(query: ListPricingQueryDto) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.cityId) where.cityId = query.cityId;
    if (query.vehicleTypeId) where.vehicleTypeId = query.vehicleTypeId;

    const [pricingConfigs, total] = await Promise.all([
      this.prisma.pricingConfig.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ city: { name: 'asc' } }, { vehicleType: { name: 'asc' } }],
        include: {
          city: true,
          vehicleType: true,
        },
      }),
      this.prisma.pricingConfig.count({ where }),
    ]);

    return {
      pricingConfigs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPricingDetail(id: string) {
    const config = await this.prisma.pricingConfig.findUnique({
      where: { id },
      include: {
        city: true,
        vehicleType: true,
      },
    });

    if (!config) {
      throw new NotFoundException(`Pricing configuration with ID ${id} not found`);
    }

    return config;
  }

  async updatePricing(id: string, dto: UpdatePricingDto, adminUserId: string) {
    const existing = await this.prisma.pricingConfig.findUnique({
      where: { id },
      include: {
        city: true,
        vehicleType: true,
      },
    });

    if (!existing) {
      throw new NotFoundException(`Pricing configuration with ID ${id} not found`);
    }

    if (dto.baseFare !== undefined && dto.baseFare < 0) {
      throw new BadRequestException('baseFare cannot be negative');
    }
    if (dto.perKmRate !== undefined && dto.perKmRate < 0) {
      throw new BadRequestException('perKmRate cannot be negative');
    }
    if (dto.perMinRate !== undefined && dto.perMinRate < 0) {
      throw new BadRequestException('perMinRate cannot be negative');
    }
    if (dto.minimumFare !== undefined && dto.minimumFare < 0) {
      throw new BadRequestException('minimumFare cannot be negative');
    }

    const previousState = {
      baseFare: existing.baseFare,
      perKmRate: existing.perKmRate,
      perMinRate: existing.perMinRate,
      minimumFare: existing.minimumFare,
      isActive: existing.isActive,
    };

    const updated = await this.prisma.$transaction(async (tx) => {
      const config = await tx.pricingConfig.update({
        where: { id },
        data: {
          baseFare: dto.baseFare !== undefined ? dto.baseFare : existing.baseFare,
          perKmRate: dto.perKmRate !== undefined ? dto.perKmRate : existing.perKmRate,
          perMinRate: dto.perMinRate !== undefined ? dto.perMinRate : existing.perMinRate,
          minimumFare: dto.minimumFare !== undefined ? dto.minimumFare : existing.minimumFare,
          isActive: dto.isActive !== undefined ? dto.isActive : existing.isActive,
        },
        include: {
          city: true,
          vehicleType: true,
        },
      });

      await this.auditService.createAuditLog(
        {
          adminUserId,
          action: 'PRICING_UPDATED',
          entityType: 'PRICING_CONFIG',
          entityId: id,
          reason: 'Admin updated fare parameters',
          metadata: {
            city: existing.city.name,
            vehicleType: existing.vehicleType.name,
            previousState,
            newState: {
              baseFare: config.baseFare,
              perKmRate: config.perKmRate,
              perMinRate: config.perMinRate,
              minimumFare: config.minimumFare,
              isActive: config.isActive,
            },
          },
        },
        tx,
      );

      return config;
    });

    this.logger.log(`Pricing config ${id} updated by admin ${adminUserId}`);
    return updated;
  }
}
