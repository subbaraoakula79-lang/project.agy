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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { PaymentsService } from './payments.service';

@Controller('rides')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /** GET /rides/:id/payment — Get payment record for a ride */
  @Get(':id/payment')
  async getPayment(
    @Param('id') rideId: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: UserRole,
  ): Promise<ApiResponse> {
    const data = await this.paymentsService.getPaymentByRideId(rideId, userId, role);
    return { success: true, data };
  }

  /** POST /rides/:id/payment/initiate — Initiate payment (Rider only) */
  @Post(':id/payment/initiate')
  @Roles(UserRole.RIDER)
  @HttpCode(HttpStatus.OK)
  async initiatePayment(
    @Param('id') rideId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: InitiatePaymentDto,
  ): Promise<ApiResponse> {
    const data = await this.paymentsService.initiatePayment(rideId, userId, dto?.method);
    return { success: true, data };
  }

  /** POST /rides/:id/payment/confirm — Confirm UPI payment (Rider only) */
  @Post(':id/payment/confirm')
  @Roles(UserRole.RIDER)
  @HttpCode(HttpStatus.OK)
  async confirmUpiPayment(
    @Param('id') rideId: string,
    @CurrentUser('userId') userId: string,
    @Body('simulateFailure') simulateFailure?: boolean,
  ): Promise<ApiResponse> {
    const data = await this.paymentsService.confirmUpiPayment(rideId, userId, { simulateFailure });
    return { success: true, data };
  }

  /** POST /rides/:id/payment/confirm-cash — Confirm cash collected (Driver path alias) */
  @Post(':id/payment/confirm-cash')
  @Roles(UserRole.DRIVER)
  @HttpCode(HttpStatus.OK)
  async confirmCashUnderRides(
    @Param('id') rideId: string,
    @CurrentUser('userId') userId: string,
  ): Promise<ApiResponse> {
    const data = await this.paymentsService.confirmCashPayment(rideId, userId);
    return { success: true, data };
  }
}

/**
 * Driver-prefixed alias controller for `/driver/rides/:id/payment/confirm-cash`
 * and `/drivers/rides/:id/payment/confirm-cash`.
 */
@Controller('driver/rides')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.DRIVER)
export class DriverPaymentAliasController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post(':id/payment/confirm-cash')
  @HttpCode(HttpStatus.OK)
  async confirmCash(
    @Param('id') rideId: string,
    @CurrentUser('userId') userId: string,
  ): Promise<ApiResponse> {
    const data = await this.paymentsService.confirmCashPayment(rideId, userId);
    return { success: true, data };
  }
}

@Controller('drivers/rides')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.DRIVER)
export class DriversPaymentAliasController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post(':id/payment/confirm-cash')
  @HttpCode(HttpStatus.OK)
  async confirmCash(
    @Param('id') rideId: string,
    @CurrentUser('userId') userId: string,
  ): Promise<ApiResponse> {
    const data = await this.paymentsService.confirmCashPayment(rideId, userId);
    return { success: true, data };
  }
}
