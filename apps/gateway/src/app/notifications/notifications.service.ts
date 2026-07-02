import { Injectable, Logger } from '@nestjs/common';

type DigestJob = { title: string; company: string; url: string };

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly url = process.env.NOTIFICATIONS_URL ?? 'http://localhost:8082';

  async sendDigest(to: string, jobs: DigestJob[]): Promise<void> {
    try {
      const res = await fetch(`${this.url}/digest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, jobs }),
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) {
        this.logger.warn(`digest returned ${res.status} for ${to}`);
      }
    } catch (err) {
      this.logger.warn(`digest failed for ${to}: ${(err as Error).message}`);
    }
  }
}
