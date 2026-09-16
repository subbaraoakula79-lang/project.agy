import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiResponse, RegisterDeviceTokenDto } from '@yatra-seva/shared-types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /** GET /notifications — Get paginated notification history for authenticated user. */
  @Get()
  async getUserNotifications(
    @CurrentUser() user: { userId: string },
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ): Promise<ApiResponse> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;

    const data = await this.notificationsService.getUserNotifications(
      user.userId,
      pageNum,
      limitNum
    );

    return { success: true, data };
  }

  /** GET /notifications/unread-count — Get unread notification count. */
  @Get('unread-count')
  async getUnreadCount(@CurrentUser() user: { userId: string }): Promise<ApiResponse> {
    const count = await this.notificationsService.getUnreadCount(user.userId);
    return { success: true, data: { unreadCount: count } };
  }

  /** PATCH /notifications/:id/read — Mark single notification as read. */
  @Patch(':id/read')
  async markAsRead(
    @CurrentUser() user: { userId: string },
    @Param('id') notificationId: string
  ): Promise<ApiResponse> {
    const data = await this.notificationsService.markAsRead(user.userId, notificationId);
    return { success: true, data };
  }

  /** PATCH /notifications/read-all — Mark all notifications as read for current user. */
  @Patch('read-all')
  async markAllAsRead(@CurrentUser() user: { userId: string }): Promise<ApiResponse> {
    const data = await this.notificationsService.markAllAsRead(user.userId);
    return { success: true, data };
  }

  /** POST /notifications/:id/retry — Retry failed notification delivery. */
  @Post(':id/retry')
  @HttpCode(HttpStatus.OK)
  async retryFailedNotification(
    @CurrentUser() user: { userId: string },
    @Param('id') notificationId: string
  ): Promise<ApiResponse> {
    const data = await this.notificationsService.retryFailedNotification(user.userId, notificationId);
    return { success: true, data };
  }

  /** POST /notifications/device-token — Register a device push token. */
  @Post('device-token')
  async registerDeviceToken(
    @CurrentUser() user: { userId: string },
    @Body() dto: RegisterDeviceTokenDto
  ): Promise<ApiResponse> {
    const data = await this.notificationsService.registerDeviceToken(user.userId, dto);
    return { success: true, data };
  }

  /** DELETE /notifications/device-token — Deactivate a device push token. */
  @Delete('device-token')
  async deactivateDeviceToken(
    @CurrentUser() user: { userId: string },
    @Body('token') token: string
  ): Promise<ApiResponse> {
    await this.notificationsService.deactivateDeviceToken(user.userId, token);
    return { success: true, data: { message: 'Token deactivated successfully' } };
  }
}
