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
import { AdminPricingService, ListPricingQueryDto } from '../services/admin-pricing.service';
import { UpdatePricingDto } from '../dto/admin.dto';

@Controller('admin/pricing')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminPricingController {
  constructor(private readonly pricingService: AdminPricingService) {}

  @Get()
  async listPricingConfigs(@Query() query: ListPricingQueryDto) {
    const data = await this.pricingService.listPricingConfigs(query);
    return { success: true, ...data };
  }

  @Get(':id')
  async getPricingDetail(@Param('id') id: string) {
    const data = await this.pricingService.getPricingDetail(id);
    return { success: true, data };
  }

  @Patch(':id')
  async updatePricing(
    @Param('id') id: string,
    @Body() dto: UpdatePricingDto,
    @CurrentUser('userId') adminUserId: string,
  ) {
    const data = await this.pricingService.updatePricing(id, dto, adminUserId);
    return { success: true, message: 'Pricing configuration updated', data };
  }
}
