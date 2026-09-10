import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiResponse, UserRole } from '@yatra-seva/shared-types';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { UpdateLocationDto } from '../dto/update-location.dto';
import { DriversService } from '../services/drivers.service';

@Controller('drivers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.DRIVER)
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  /** PATCH /drivers/location — Update driver's persisted location */
  @Patch('location')
  @HttpCode(HttpStatus.OK)
  async updateLocation(
    @CurrentUser('userId') userId: string,
    @Body() dto: UpdateLocationDto,
  ): Promise<ApiResponse> {
    const data = await this.driversService.updateLocation(userId, dto);
    return { success: true, data };
  }

  /** POST /drivers/availability/online — Go online & available */
  @Post('availability/online')
  @HttpCode(HttpStatus.OK)
  async setOnline(@CurrentUser('userId') userId: string): Promise<ApiResponse> {
    const data = await this.driversService.setOnline(userId);
    return { success: true, data };
  }

  /** POST /drivers/availability/offline — Go offline */
  @Post('availability/offline')
  @HttpCode(HttpStatus.OK)
  async setOffline(@CurrentUser('userId') userId: string): Promise<ApiResponse> {
    const data = await this.driversService.setOffline(userId);
    return { success: true, data };
  }

  /** GET /drivers/availability — Get current availability state */
  @Get('availability')
  async getAvailability(@CurrentUser('userId') userId: string): Promise<ApiResponse> {
    const data = await this.driversService.getAvailability(userId);
    return { success: true, data };
  }

  /** POST /drivers/rides/:rideId/accept — Accept an offered ride */
  @Post('rides/:rideId/accept')
  @HttpCode(HttpStatus.OK)
  async acceptRide(
    @Param('rideId') rideId: string,
    @CurrentUser('userId') userId: string,
  ): Promise<ApiResponse> {
    const data = await this.driversService.acceptRide(userId, rideId);
    return { success: true, data };
  }

  /** POST /drivers/rides/:rideId/reject — Reject an offered ride */
  @Post('rides/:rideId/reject')
  @HttpCode(HttpStatus.OK)
  async rejectRide(
    @Param('rideId') rideId: string,
    @CurrentUser('userId') userId: string,
  ): Promise<ApiResponse> {
    const data = await this.driversService.rejectRide(userId, rideId);
    return { success: true, data };
  }

  /** GET /drivers/rides/requests — Get active incoming ride requests for this driver */
  @Get('rides/requests')
  async getPendingRequests(@CurrentUser('userId') userId: string): Promise<ApiResponse> {
    const data = await this.driversService.getDriverPendingRequests(userId);
    return { success: true, data };
  }

  /** POST /drivers/rides/:rideId/arriving — Driver en route to pickup */
  @Post('rides/:rideId/arriving')
  @HttpCode(HttpStatus.OK)
  async markArriving(
    @Param('rideId') rideId: string,
    @CurrentUser('userId') userId: string,
  ): Promise<ApiResponse> {
    const data = await this.driversService.markArriving(userId, rideId);
    return { success: true, data };
  }

  /** POST /drivers/rides/:rideId/arrived — Driver arrived at pickup */
  @Post('rides/:rideId/arrived')
  @HttpCode(HttpStatus.OK)
  async markArrived(
    @Param('rideId') rideId: string,
    @CurrentUser('userId') userId: string,
  ): Promise<ApiResponse> {
    const data = await this.driversService.markArrived(userId, rideId);
    return { success: true, data };
  }

  /** POST /drivers/rides/:rideId/start — Start the ride */
  @Post('rides/:rideId/start')
  @HttpCode(HttpStatus.OK)
  async startRide(
    @Param('rideId') rideId: string,
    @CurrentUser('userId') userId: string,
  ): Promise<ApiResponse> {
    const data = await this.driversService.startRide(userId, rideId);
    return { success: true, data };
  }

  /** POST /drivers/rides/:rideId/complete — Complete ride (transitions to PAYMENT_PENDING) */
  @Post('rides/:rideId/complete')
  @HttpCode(HttpStatus.OK)
  async completeRide(
    @Param('rideId') rideId: string,
    @CurrentUser('userId') userId: string,
  ): Promise<ApiResponse> {
    const data = await this.driversService.completeRide(userId, rideId);
    return { success: true, data };
  }

  /** POST /drivers/rides/:rideId/cancel — Driver cancels assigned ride */
  @Post('rides/:rideId/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelRide(
    @Param('rideId') rideId: string,
    @CurrentUser('userId') userId: string,
    @Body('reason') reason?: string,
  ): Promise<ApiResponse> {
    const data = await this.driversService.cancelDriverRide(userId, rideId, reason);
    return { success: true, data };
  }
}

/**
 * Secondary Controller to support the exact path alias `/driver/rides/...`
 * requested in the Phase 4 specification.
 */
@Controller('driver')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.DRIVER)
export class DriverAliasController {
  constructor(private readonly driversService: DriversService) {}

  /** PATCH /driver/location */
  @Patch('location')
  @HttpCode(HttpStatus.OK)
  async updateLocation(
    @CurrentUser('userId') userId: string,
    @Body() dto: UpdateLocationDto,
  ): Promise<ApiResponse> {
    const data = await this.driversService.updateLocation(userId, dto);
    return { success: true, data };
  }

  /** POST /driver/availability/online */
  @Post('availability/online')
  @HttpCode(HttpStatus.OK)
  async setOnline(@CurrentUser('userId') userId: string): Promise<ApiResponse> {
    const data = await this.driversService.setOnline(userId);
    return { success: true, data };
  }

  /** POST /driver/availability/offline */
  @Post('availability/offline')
  @HttpCode(HttpStatus.OK)
  async setOffline(@CurrentUser('userId') userId: string): Promise<ApiResponse> {
    const data = await this.driversService.setOffline(userId);
    return { success: true, data };
  }

  /** GET /driver/availability */
  @Get('availability')
  async getAvailability(@CurrentUser('userId') userId: string): Promise<ApiResponse> {
    const data = await this.driversService.getAvailability(userId);
    return { success: true, data };
  }

  /** POST /driver/rides/:rideId/accept */
  @Post('rides/:rideId/accept')
  @HttpCode(HttpStatus.OK)
  async acceptRide(
    @Param('rideId') rideId: string,
    @CurrentUser('userId') userId: string,
  ): Promise<ApiResponse> {
    const data = await this.driversService.acceptRide(userId, rideId);
    return { success: true, data };
  }

  /** POST /driver/rides/:rideId/reject */
  @Post('rides/:rideId/reject')
  @HttpCode(HttpStatus.OK)
  async rejectRide(
    @Param('rideId') rideId: string,
    @CurrentUser('userId') userId: string,
  ): Promise<ApiResponse> {
    const data = await this.driversService.rejectRide(userId, rideId);
    return { success: true, data };
  }

  /** GET /driver/rides/requests */
  @Get('rides/requests')
  async getPendingRequests(@CurrentUser('userId') userId: string): Promise<ApiResponse> {
    const data = await this.driversService.getDriverPendingRequests(userId);
    return { success: true, data };
  }

  /** POST /driver/rides/:rideId/arriving */
  @Post('rides/:rideId/arriving')
  @HttpCode(HttpStatus.OK)
  async markArriving(
    @Param('rideId') rideId: string,
    @CurrentUser('userId') userId: string,
  ): Promise<ApiResponse> {
    const data = await this.driversService.markArriving(userId, rideId);
    return { success: true, data };
  }

  /** POST /driver/rides/:rideId/arrived */
  @Post('rides/:rideId/arrived')
  @HttpCode(HttpStatus.OK)
  async markArrived(
    @Param('rideId') rideId: string,
    @CurrentUser('userId') userId: string,
  ): Promise<ApiResponse> {
    const data = await this.driversService.markArrived(userId, rideId);
    return { success: true, data };
  }

  /** POST /driver/rides/:rideId/start */
  @Post('rides/:rideId/start')
  @HttpCode(HttpStatus.OK)
  async startRide(
    @Param('rideId') rideId: string,
    @CurrentUser('userId') userId: string,
  ): Promise<ApiResponse> {
    const data = await this.driversService.startRide(userId, rideId);
    return { success: true, data };
  }

  /** POST /driver/rides/:rideId/complete */
  @Post('rides/:rideId/complete')
  @HttpCode(HttpStatus.OK)
  async completeRide(
    @Param('rideId') rideId: string,
    @CurrentUser('userId') userId: string,
  ): Promise<ApiResponse> {
    const data = await this.driversService.completeRide(userId, rideId);
    return { success: true, data };
  }

  /** POST /driver/rides/:rideId/cancel */
  @Post('rides/:rideId/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelRide(
    @Param('rideId') rideId: string,
    @CurrentUser('userId') userId: string,
    @Body('reason') reason?: string,
  ): Promise<ApiResponse> {
    const data = await this.driversService.cancelDriverRide(userId, rideId, reason);
    return { success: true, data };
  }
}
