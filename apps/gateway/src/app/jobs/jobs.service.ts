import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { InAppNotificationsService } from '../notifications/in-app-notifications.service';
import { CreateJobDto } from './dto/create-job.dto';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private inApp: InAppNotificationsService,
  ) {}

  async createMany(jobs: CreateJobDto[]) {
    const result = await this.prisma.job.createMany({
      data: jobs.map((job) => ({
        ...job,
        postedAt: new Date(job.postedAt),
      })),
      skipDuplicates: true,
    });

    if (result.count > 0) {
      this.logger.log(`Ingested ${result.count} new jobs — sending digest`);
      this.sendJobDigest(jobs).catch(() => {});
      const n = result.count;
      this.inApp.createForAllUsers(
        'jobs',
        `${n} new job${n > 1 ? 's' : ''} added`,
        `${n} new listing${n > 1 ? 's' : ''} just landed. Check them out in Job Hunt.`,
      ).catch(() => {});
    }

    return result;
  }

  private async sendJobDigest(jobs: CreateJobDto[]) {
    const users = await this.prisma.user.findMany({
      select: { email: true },
    });

    if (users.length === 0) return;

    const digestJobs = jobs.slice(0, 10).map((j) => ({
      title: j.title,
      company: j.company,
      url: j.url,
    }));

    await Promise.allSettled(
      users.map((u) => this.notifications.sendDigest(u.email, digestJobs)),
    );
  }

  async findAll(userId: string) {
    return this.prisma.job.findMany({
      orderBy: { postedAt: 'desc' },
      take: 50,
    });
  }

  async saveJob(userId: string, jobId: string) {
    return this.prisma.savedJob.create({
      data: { userId, jobId },
    });
  }

  async unsaveJob(userId: string, jobId: string) {
    return this.prisma.savedJob.delete({
      where: { userId_jobId: { userId, jobId } },
    });
  }

  async getSavedJobs(userId: string) {
    return this.prisma.savedJob.findMany({
      where: { userId },
      include: { job: true },
      orderBy: { savedAt: 'desc' },
    });
  }
}
