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
import fetch from 'node-fetch';

@Controller({ path: 'jobs', version: '1' })
// @Version('1')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  findAll() {
    // TODO: get userId from auth guard
    return this.jobsService.findAll('temp-user-id');
  }

  @Post('ingest')
  ingest(@Body() body: { jobs: any[] }) {
    return this.jobsService.createMany(body.jobs);
  }

  @Post(':jobId/save')
  save(@Param('jobId') jobId: string) {
    return this.jobsService.saveJob('temp-user-id', jobId);
  }

  @Delete(':jobId/save')
  unsave(@Param('jobId') jobId: string) {
    return this.jobsService.unsaveJob('temp-user-id', jobId);
  }

  @Get('saved')
  saved() {
    return this.jobsService.getSavedJobs('temp-user-id');
  }

  @Post('trigger-scrape')
  async triggerScrape() {
    const scraperUrl = process.env.JOB_SCRAPER_URL ?? 'http://localhost:8080';
    const response = await fetch(`${scraperUrl}/trigger`, { method: 'POST' });
    return response.json();
  }
}
