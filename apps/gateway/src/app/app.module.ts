import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JobsModule } from './jobs/jobs.module';
import { DsaModule } from './dsa/dsa.module';
import { PrismaModule } from '../shared/prisma/prisma.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ReferencesModule } from './references/references.module';
import { HttpLoggerMiddleware } from '../shared/logger/http-logger.middleware';
import { APP_GUARD } from '@nestjs/core';
import { ClerkGuard } from './auth/guards/clerk.guard';

@Module({
  imports: [PrismaModule, NotificationsModule, JobsModule, DsaModule, ReferencesModule],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ClerkGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HttpLoggerMiddleware).forRoutes('*');
  }
}
