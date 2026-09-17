import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserRole } from '@yatra-seva/shared-types';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AdminRideService } from '../services/admin-ride.service';
import { ListRidesQueryDto, AdminCancelRideDto } from '../dto/admin.dto';

@Controller('admin/rides')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminRidesController {
  constructor(private readonly rideService: AdminRideService) {}

  @Get()
  async listRides(@Query() query: ListRidesQueryDto) {
    const data = await this.rideService.listRides(query);
    return { success: true, ...data };
  }

  @Get(':id')
  async getRideDetail(@Param('id') id: string) {
    const data = await this.rideService.getRideDetail(id);
    return { success: true, data };
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelRide(
    @Param('id') id: string,
    @Body() dto: AdminCancelRideDto,
    @CurrentUser('userId') adminUserId: string,
  ) {
    const data = await this.rideService.cancelRide(id, adminUserId, dto.reason);
    return { success: true, message: 'Ride cancelled by admin', data };
  }
}
