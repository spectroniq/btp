import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
// import { Prisma } from '../../generated/prisma/client';
import { CreateJobDto } from './dto/create-job.dto';

@Injectable()
export class JobsService {
  constructor(private prisma: PrismaService) {}

  async createMany(jobs: CreateJobDto[]) {
    return this.prisma.job.createMany({
      data: jobs.map((job) => ({
        ...job,
        postedAt: new Date(job.postedAt),
      })),
      skipDuplicates: true,
    });
  }

  async findAll(userId: string) {
    const jobs = await this.prisma.job.findMany({
      orderBy: { postedAt: 'desc' },
      take: 50,
    });
    console.log(jobs);
    return jobs;
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
