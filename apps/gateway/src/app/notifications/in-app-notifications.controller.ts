import { Controller, Get, Patch, Param } from '@nestjs/common';
import { InAppNotificationsService } from './in-app-notifications.service';
import { CurrentUserId } from '../auth/decorators/current-user.decorator';

@Controller({ path: 'notifications', version: '1' })
export class InAppNotificationsController {
  constructor(private readonly svc: InAppNotificationsService) {}

  @Get()
  findAll(@CurrentUserId() userId: string) {
    return this.svc.findAllForUser(userId);
  }

  @Patch('read-all')
  markAllRead(@CurrentUserId() userId: string) {
    return this.svc.markAllRead(userId);
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string, @CurrentUserId() userId: string) {
    return this.svc.markRead(userId, id);
  }
}
