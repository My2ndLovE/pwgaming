import { INestApplication } from '@nestjs/common';
import * as compression from 'compression';

export function setupCompression(app: INestApplication) {
  app.use(
    compression({
      filter: (req, res) => {
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
