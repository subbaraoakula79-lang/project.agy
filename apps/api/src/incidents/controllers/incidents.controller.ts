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
import { IncidentsService } from '../services/incidents.service';
import {
  CreateIncidentDto,
  UpdateIncidentStatusDto,
  UpdateIncidentSeverityDto,
} from '../dto/incidents.dto';

@Controller()
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Post('incidents')
  @UseGuards(JwtAuthGuard)
  async createIncident(@Req() req: any, @Body() dto: CreateIncidentDto) {
    const userId = req.user.id;
    const data = await this.incidentsService.createIncident(userId, dto);
    return { success: true, data };
  }

  @Get('incidents')
  @UseGuards(JwtAuthGuard)
  async listUserIncidents(
    @Req() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const userId = req.user.id;
    const res = await this.incidentsService.listUserIncidents(userId, { page, limit });
    return { success: true, data: res.data, meta: res.meta };
  }

  @Get('incidents/:id')
  @UseGuards(JwtAuthGuard)
  async getIncidentById(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.id;
    const role = req.user.role;
    const data = await this.incidentsService.getIncidentById(id, userId, role);
    return { success: true, data };
  }

  @Get('admin/incidents')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async listAdminIncidents(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('severity') severity?: string,
  ) {
    const res = await this.incidentsService.listAdminIncidents({
      page,
      limit,
      status,
      category,
      severity,
    });
    return { success: true, data: res.data, meta: res.meta };
  }

  @Patch('admin/incidents/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateIncidentStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateIncidentStatusDto,
  ) {
    const adminUserId = req.user.id;
    const data = await this.incidentsService.updateIncidentStatus(id, adminUserId, dto);
    return { success: true, data };
  }

  @Patch('admin/incidents/:id/severity')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateIncidentSeverity(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateIncidentSeverityDto,
  ) {
    const adminUserId = req.user.id;
    const data = await this.incidentsService.updateIncidentSeverity(id, adminUserId, dto);
    return { success: true, data };
  }
}
