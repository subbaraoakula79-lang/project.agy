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
import { SupportService } from '../services/support.service';
import { CreateSupportTicketDto, UpdateSupportTicketStatusDto } from '../dto/support.dto';

@Controller()
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('support/tickets')
  @UseGuards(JwtAuthGuard)
  async createTicket(@Req() req: any, @Body() dto: CreateSupportTicketDto) {
    const userId = req.user.id;
    const data = await this.supportService.createTicket(userId, dto);
    return { success: true, data };
  }

  @Get('support/tickets')
  @UseGuards(JwtAuthGuard)
  async listUserTickets(
    @Req() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const userId = req.user.id;
    const res = await this.supportService.listUserTickets(userId, { page, limit });
    return { success: true, data: res.data, meta: res.meta };
  }

  @Get('support/tickets/:id')
  @UseGuards(JwtAuthGuard)
  async getTicketById(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.id;
    const role = req.user.role;
    const data = await this.supportService.getTicketById(id, userId, role);
    return { success: true, data };
  }

  @Get('admin/support/tickets')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async listAdminTickets(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('priority') priority?: string,
  ) {
    const res = await this.supportService.listAdminTickets({
      page,
      limit,
      status,
      category,
      priority,
    });
    return { success: true, data: res.data, meta: res.meta };
  }

  @Patch('admin/support/tickets/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateTicketStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateSupportTicketStatusDto,
  ) {
    const adminUserId = req.user.id;
    const data = await this.supportService.updateTicketStatus(id, adminUserId, dto);
    return { success: true, data };
  }
}
