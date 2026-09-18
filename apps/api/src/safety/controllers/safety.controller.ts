import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@yatra-seva/shared-types';
import { SafetyService } from '../services/safety.service';
import { TriggerSosDto, ResolveSosDto, ShareTripDto } from '../dto/safety.dto';

@Controller()
export class SafetyController {
  constructor(private readonly safetyService: SafetyService) {}

  @Post('safety/sos')
  @UseGuards(JwtAuthGuard)
  async triggerSos(@Req() req: any, @Body() dto: TriggerSosDto) {
    const userId = req.user.id;
    const data = await this.safetyService.triggerSos(userId, dto);
    return { success: true, data };
  }

  @Post('safety/share-trip')
  @UseGuards(JwtAuthGuard)
  async shareTrip(@Req() req: any, @Body() dto: ShareTripDto) {
    const userId = req.user.id;
    const data = await this.safetyService.createTripShare(userId, dto);
    return { success: true, data };
  }

  @Get('safety/shared-trip/:token')
  async getSharedTrip(@Param('token') token: string) {
    const data = await this.safetyService.getSharedTrip(token);
    return { success: true, data };
  }

  @Patch('admin/safety/sos/:id/resolve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async resolveSos(
    @Req() req: any,
    @Param('id') eventId: string,
    @Body() dto: ResolveSosDto,
  ) {
    const adminUserId = req.user.id;
    const data = await this.safetyService.resolveSos(eventId, adminUserId, dto);
    return { success: true, data };
  }

  @Get('admin/safety/events')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async listSafetyEvents(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    const res = await this.safetyService.listSafetyEvents({ page, limit, status });
    return { success: true, data: res.data, meta: res.meta };
  }
}
