import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiResponse, UserRole } from '@yatra-seva/shared-types';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { CreateRideDto } from '../dto/create-ride.dto';
import { FareEstimateQueryDto } from '../dto/fare-estimate-query.dto';
import { RideRecord, RidesService } from '../services/rides.service';

@Controller('rides')
export class RidesController {
  constructor(private readonly ridesService: RidesService) {}

  /** GET /rides/locations — Get Kakinada mock locations for autocomplete. */
  @Get('locations')
  async getLocations(): Promise<ApiResponse> {
    const data = await this.ridesService.getKakinadaLocations();
    return { success: true, data };
  }

  /** POST /rides/estimate — Calculate fare estimates for all vehicle types. */
  @Post('estimate')
  @HttpCode(HttpStatus.OK)
  async getEstimates(@Body() dto: FareEstimateQueryDto): Promise<ApiResponse> {
    const data = await this.ridesService.getFareEstimates(dto);
    return { success: true, data };
  }

  /** POST /rides — Create a new ride request (Rider only). */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RIDER)
  @HttpCode(HttpStatus.CREATED)
  async createRide(
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: UserRole,
    @Body() dto: CreateRideDto,
  ): Promise<ApiResponse<RideRecord>> {
    const data = await this.ridesService.createRide(userId, role, dto);
    return { success: true, data };
  }

  /** GET /rides — Get all rides requested by authenticated rider. */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RIDER)
  async getRiderRides(
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: UserRole,
  ): Promise<ApiResponse<RideRecord[]>> {
    const data = await this.ridesService.getRiderRides(userId, role);
    return { success: true, data };
  }

  /** GET /rides/active — Get current active ride for authenticated user. */
  @Get('active')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getActiveRide(
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: UserRole,
  ): Promise<ApiResponse<RideRecord | null>> {
    const data = await this.ridesService.getActiveRide(userId, role);
    return { success: true, data };
  }

  /** POST /rides/:id/cancel — Rider cancels ride (governed by state machine rules). */
  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RIDER)
  @HttpCode(HttpStatus.OK)
  async cancelRide(
    @Param('id') rideId: string,
    @CurrentUser('userId') userId: string,
    @Body('reason') reason?: string,
  ): Promise<ApiResponse<RideRecord>> {
    const data = await this.ridesService.cancelRiderRide(userId, rideId, reason);
    return { success: true, data };
  }

  /** GET /rides/:id — Get specific ride by ID (Enforces ownership). */
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getRideById(
    @Param('id') rideId: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: UserRole,
  ): Promise<ApiResponse<RideRecord>> {
    const data = await this.ridesService.getRideById(rideId, userId, role);
    return { success: true, data };
  }
}
