import { Controller, Post, Body, Get, Param, Patch, ParseIntPipe, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Roles('admin')
  @Post('send-email')
  async sendEmail(@Body() body: { to: string; subject: string; text: string }) {
    const { to, subject, text } = body;
    await this.notificationsService.sendEmailNotification(to, subject, text);
    return { message: 'Email notification sent successfully' };
  }

  @Roles('admin')
  @Post('create')
  async createNotification(@Body() body: { userId: number; message: string }) {
    const { userId, message } = body;
    const notification = await this.notificationsService.createNotification(userId, message);
    return { message: 'In-app notification created successfully', notification };
  }

  @Roles('admin', 'user')
  @Get(':userId')
  async getNotifications(@Param('userId', ParseIntPipe) userId: number) {
    return this.notificationsService.getNotifications(userId);
  }

  @Roles('admin', 'user')
  @Patch('mark-as-read/:id')
  async markAsRead(@Param('id') id: number) {
    await this.notificationsService.markAsRead(id);
    return { message: 'Notification marked as read' };
  }
}