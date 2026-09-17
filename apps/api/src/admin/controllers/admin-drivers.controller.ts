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
import { AdminDriverService } from '../services/admin-driver.service';
import {
  ListDriversQueryDto,
  RejectDriverDto,
  SuspendDriverDto,
  RejectDocumentDto,
} from '../dto/admin.dto';

@Controller('admin/drivers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminDriversController {
  constructor(private readonly driverService: AdminDriverService) {}

  @Get()
  async listDrivers(@Query() query: ListDriversQueryDto) {
    const data = await this.driverService.listDrivers(query);
    return { success: true, ...data };
  }

  @Get(':id')
  async getDriverDetail(@Param('id') id: string) {
    const data = await this.driverService.getDriverDetail(id);
    return { success: true, data };
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  async approveDriver(
    @Param('id') id: string,
    @CurrentUser('userId') adminUserId: string,
  ) {
    const data = await this.driverService.approveDriver(id, adminUserId);
    return { success: true, message: 'Driver approved successfully', data };
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  async rejectDriver(
    @Param('id') id: string,
    @Body() dto: RejectDriverDto,
    @CurrentUser('userId') adminUserId: string,
  ) {
    const data = await this.driverService.rejectDriver(id, adminUserId, dto.reason);
    return { success: true, message: 'Driver rejected', data };
  }

  @Post(':id/suspend')
  @HttpCode(HttpStatus.OK)
  async suspendDriver(
    @Param('id') id: string,
    @Body() dto: SuspendDriverDto,
    @CurrentUser('userId') adminUserId: string,
  ) {
    const data = await this.driverService.suspendDriver(id, adminUserId, dto.reason);
    return { success: true, message: 'Driver suspended', data };
  }

  @Post(':id/reactivate')
  @HttpCode(HttpStatus.OK)
  async reactivateDriver(
    @Param('id') id: string,
    @CurrentUser('userId') adminUserId: string,
  ) {
    const data = await this.driverService.reactivateDriver(id, adminUserId);
    return { success: true, message: 'Driver reactivated', data };
  }

  @Get(':id/documents')
  async getDriverDocuments(@Param('id') id: string) {
    const data = await this.driverService.getDriverDocuments(id);
    return { success: true, data };
  }

  @Post(':id/documents/:docId/approve')
  @HttpCode(HttpStatus.OK)
  async approveDocument(
    @Param('id') driverId: string,
    @Param('docId') docId: string,
    @CurrentUser('userId') adminUserId: string,
  ) {
    const data = await this.driverService.approveDocument(driverId, docId, adminUserId);
    return { success: true, message: 'Document approved', data };
  }

  @Post(':id/documents/:docId/reject')
  @HttpCode(HttpStatus.OK)
  async rejectDocument(
    @Param('id') driverId: string,
    @Param('docId') docId: string,
    @Body() dto: RejectDocumentDto,
    @CurrentUser('userId') adminUserId: string,
  ) {
    const data = await this.driverService.rejectDocument(driverId, docId, adminUserId, dto.reason);
    return { success: true, message: 'Document rejected', data };
  }
}
