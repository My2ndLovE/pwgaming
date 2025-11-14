import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from '../src/config/configuration';

export async function createTestApp(
  moduleMetadata: any,
): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        load: [configuration],
      }),
      TypeOrmModule.forRoot({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USERNAME || 'poker_user',
        password: process.env.DB_PASSWORD || 'poker_dev_password',
        database: process.env.DB_DATABASE_TEST || 'poker_platform_test',
        entities: [__dirname + '/../src/**/*.entity{.ts,.js}'],
        synchronize: true,
        dropSchema: true, // Clean slate for each test run
      }),
      ...moduleMetadata.imports,
    ],
    controllers: moduleMetadata.controllers || [],
    providers: moduleMetadata.providers || [],
  }).compile();

  const app = moduleFixture.createNestApplication();
  await app.init();
  return app;
}

export async function closeTestApp(app: INestApplication): Promise<void> {
  if (app) {
    await app.close();
  }
}
