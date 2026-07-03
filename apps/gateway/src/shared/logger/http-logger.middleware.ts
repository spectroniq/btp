import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

const STATUS_COLORS: Record<string, string> = {
  '2': '\x1b[32m', // green
  '3': '\x1b[36m', // cyan
  '4': '\x1b[33m', // yellow
  '5': '\x1b[31m', // red
};
const RESET = '\x1b[0m';
const DIM = '\x1b[2m';

@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl } = req;
    const start = Date.now();

    res.on('finish', () => {
      const ms = Date.now() - start;
      const status = res.statusCode;
      const color = STATUS_COLORS[String(status)[0]] ?? RESET;
      this.logger.log(
        `${method} ${originalUrl} ${color}${status}${RESET} ${DIM}${ms}ms${RESET}`,
      );
    });

    next();
  }
}
