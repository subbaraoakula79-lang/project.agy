import { IsOptional, IsString, IsInt, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

// ── Pagination ──────────────────────────────────────────────────

export class PaginationQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;
}

// ── Drivers ─────────────────────────────────────────────────────

export class ListDriversQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  verificationStatus?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  vehicleType?: string;
}

export class RejectDriverDto {
  @IsString()
  reason!: string;
}

export class SuspendDriverDto {
  @IsString()
  reason!: string;
}

// ── Documents ───────────────────────────────────────────────────

export class RejectDocumentDto {
  @IsString()
  reason!: string;
}

// ── Rides ────────────────────────────────────────────────────────

export class ListRidesQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  vehicleType?: string;

  @IsOptional()
  @IsString()
  search?: string;
}

export class AdminCancelRideDto {
  @IsString()
  reason!: string;
}

// ── Vehicles ────────────────────────────────────────────────────

export class ListVehiclesQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  vehicleType?: string;

  @IsOptional()
  @IsString()
  driverProfileId?: string;

  @IsOptional()
  @IsString()
  search?: string;
}

export class UpdateVehicleDto {
  @IsOptional()
  isActive?: boolean;
}

// ── Cities ──────────────────────────────────────────────────────

export class UpdateCityDto {
  @IsOptional()
  isActive?: boolean;
}

// ── Pricing ─────────────────────────────────────────────────────

export class UpdatePricingDto {
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  baseFare?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  perKmRate?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  perMinRate?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  minimumFare?: number;

  @IsOptional()
  isActive?: boolean;
}

// ── Audit Logs ──────────────────────────────────────────────────

export class ListAuditLogsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsString()
  entityType?: string;

  @IsOptional()
  @IsString()
  adminUserId?: string;
}
