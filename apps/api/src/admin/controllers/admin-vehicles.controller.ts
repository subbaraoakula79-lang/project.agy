import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@yatra-seva/shared-types';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AdminVehicleService } from '../services/admin-vehicle.service';
import { ListVehiclesQueryDto, UpdateVehicleDto } from '../dto/admin.dto';

@Controller('admin/vehicles')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminVehiclesController {
  constructor(private readonly vehicleService: AdminVehicleService) {}

  @Get()
  async listVehicles(@Query() query: ListVehiclesQueryDto) {
    const data = await this.vehicleService.listVehicles(query);
    return { success: true, ...data };
  }

  @Get(':id')
  async getVehicleDetail(@Param('id') id: string) {
    const data = await this.vehicleService.getVehicleDetail(id);
    return { success: true, data };
  }

  @Patch(':id')
  async updateVehicle(
    @Param('id') id: string,
    @Body() dto: UpdateVehicleDto,
    @CurrentUser('userId') adminUserId: string,
  ) {
    const data = await this.vehicleService.updateVehicle(id, adminUserId, dto);
    return { success: true, message: 'Vehicle updated', data };
  }
}
