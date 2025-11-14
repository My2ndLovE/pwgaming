import { ConfigService } from '@nestjs/config';
import { RedisOptions } from 'ioredis';

export const getRedisConfig = (configService: ConfigService): RedisOptions => {
  const isProduction = configService.get('NODE_ENV') === 'production';

  return {
    host: configService.get<string>('REDIS_HOST'),
    port: configService.get<number>('REDIS_PORT'),
    password: configService.get<string>('REDIS_PASSWORD'),
    tls: isProduction
      ? {
          servername: configService.get<string>('REDIS_HOST'),
        }
      : undefined,
    lazyConnect: true,
    retryStrategy: (times: number) => {
      if (times > 3) {
        return null; // Stop retrying
      }
      return Math.min(times * 100, 3000);
    },
  };
};
