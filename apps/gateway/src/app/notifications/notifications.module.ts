import { Global, Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { InAppNotificationsService } from './in-app-notifications.service';
import { InAppNotificationsController } from './in-app-notifications.controller';

@Global()
@Module({
  controllers: [InAppNotificationsController],
  providers: [NotificationsService, InAppNotificationsService],
  exports: [NotificationsService, InAppNotificationsService],
})
export class NotificationsModule {}
