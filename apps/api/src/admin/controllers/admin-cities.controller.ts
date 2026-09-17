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
import { AdminCityService } from '../services/admin-city.service';
import { PaginationQueryDto, UpdateCityDto } from '../dto/admin.dto';

@Controller('admin/cities')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminCitiesController {
  constructor(private readonly cityService: AdminCityService) {}

  @Get()
  async listCities(@Query() query: PaginationQueryDto) {
    const data = await this.cityService.listCities(query);
    return { success: true, ...data };
  }

  @Get(':id')
  async getCityDetail(@Param('id') id: string) {
    const data = await this.cityService.getCityDetail(id);
    return { success: true, data };
  }

  @Patch(':id')
  async updateCity(
    @Param('id') id: string,
    @Body() dto: UpdateCityDto,
    @CurrentUser('userId') adminUserId: string,
  ) {
    const data = await this.cityService.updateCity(id, dto, adminUserId);
    return { success: true, message: 'City operational status updated', data };
  }
}
