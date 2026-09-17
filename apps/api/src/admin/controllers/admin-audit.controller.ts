import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@yatra-seva/shared-types';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { AdminAuditService } from '../services/admin-audit.service';
import { ListAuditLogsQueryDto } from '../dto/admin.dto';

@Controller('admin/audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminAuditController {
  constructor(private readonly auditService: AdminAuditService) {}

  @Get()
  async listAuditLogs(@Query() query: ListAuditLogsQueryDto) {
    const data = await this.auditService.listAuditLogs(query);
    return { success: true, ...data };
  }
}
