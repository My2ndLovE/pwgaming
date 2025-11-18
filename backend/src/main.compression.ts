import { INestApplication } from '@nestjs/common';
import compression from 'compression';
import type { Request, Response } from 'express';

export function setupCompression(app: INestApplication) {
  app.use(
    compression({
      filter: (req: Request, res: Response) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        return compression.filter(req, res);
      },
      threshold: 1024, // Compress responses > 1KB
      level: 6, // Balanced compression level (0-9)
    }),
  );
}
