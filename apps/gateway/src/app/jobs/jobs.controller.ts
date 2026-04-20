import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Version,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
// import { Public } from '../auth/public.decorator';
// import { UserId } from '../auth/user.decorator';
import { CurrentUserId } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@Controller({ path: 'jobs', version: '1' })
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  findAll(@CurrentUserId() userId: string) {
    console.log('Fetching jobs');
    return this.jobsService.findAll(userId);
  }

  @Post('ingest')
  @Public()
  ingest(@Body() body: { jobs: CreateJobDto[] }) {
    return this.jobsService.createMany(body.jobs);
  }

  @Post('trigger-scrape')
  triggerScrape() {
    const scraperUrl = process.env.JOB_SCRAPER_URL ?? 'http://localhost:8080';
    return fetch(`${scraperUrl}/trigger`, { method: 'POST' }).then((r) =>
      r.json()
    );
  }

  @Post(':jobId/save')
  save(@Param('jobId') jobId: string, @CurrentUserId() userId: string) {
    return this.jobsService.saveJob(userId, jobId);
  }

  @Delete(':jobId/save')
  unsave(@Param('jobId') jobId: string, @CurrentUserId() userId: string) {
    return this.jobsService.unsaveJob(userId, jobId);
  }

  @Get('saved')
  saved(@CurrentUserId() userId: string) {
    return this.jobsService.getSavedJobs(userId);
  }
}
