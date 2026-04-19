import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JobsModule } from './jobs/jobs.module';
import { PrismaModule } from '../shared/prisma/prisma.module';

@Module({
  imports: [PrismaModule, JobsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
