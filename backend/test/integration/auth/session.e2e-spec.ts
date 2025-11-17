import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../../../src/modules/auth/auth.module';
import { User } from '../../../src/modules/auth/entities/user.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('Session Persistence (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5432'),
          username: process.env.DB_USERNAME || 'postgres',
          password: process.env.DB_PASSWORD || 'postgres',
          database: process.env.DB_DATABASE || 'poker_test',
          entities: [User],
          synchronize: true,
          dropSchema: true,
        }),
        AuthModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
  });

  afterAll(async () => {
    await userRepository.query('DELETE FROM users');
    await app.close();
  });

  beforeEach(async () => {
    await userRepository.query('DELETE FROM users');
  });

  describe('POST /auth/telegram', () => {
    it('should persist user session on successful authentication', async () => {
      const initData =
        'query_id=AAHdF6IQAAAAAN0XohDhrOrc&user=%7B%22id%22%3A279058397%2C%22first_name%22%3A%22John%22%2C%22last_name%22%3A%22Doe%22%2C%22username%22%3A%22john_doe%22%7D&auth_date=1670000000&hash=abc123';

      const response = await request(app.getHttpServer())
        .post('/auth/telegram')
        .send({ initData })
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');

      authToken = response.body.access_token;
      userId = response.body.user.id;

      // Verify user is persisted in database
      const user = await userRepository.findOne({ where: { id: userId } });
      expect(user).toBeDefined();
      expect(user?.telegramId).toBe(279058397);
      expect(user?.username).toBe('john_doe');
    });

    it('should update lastLogin timestamp on repeat authentication', async () => {
      const initData =
        'query_id=AAHdF6IQAAAAAN0XohDhrOrc&user=%7B%22id%22%3A279058397%2C%22first_name%22%3A%22John%22%2C%22username%22%3A%22john_doe%22%7D&auth_date=1670000000&hash=abc123';

      // First authentication
      const response1 = await request(app.getHttpServer())
        .post('/auth/telegram')
        .send({ initData })
        .expect(201);

      const user1 = await userRepository.findOne({ where: { id: response1.body.user.id } });
      const firstLoginTime = user1?.lastLogin;

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Second authentication
      const response2 = await request(app.getHttpServer())
        .post('/auth/telegram')
        .send({ initData })
        .expect(201);

      const user2 = await userRepository.findOne({ where: { id: response2.body.user.id } });
      const secondLoginTime = user2?.lastLogin;

      expect(user1?.id).toBe(user2?.id);
      expect(secondLoginTime).not.toEqual(firstLoginTime);
      expect(new Date(secondLoginTime!).getTime()).toBeGreaterThan(
        new Date(firstLoginTime!).getTime(),
      );
    });

    it('should persist user with correct initial values', async () => {
      const initData =
        'query_id=AAHdF6IQAAAAAN0XohDhrOrc&user=%7B%22id%22%3A279058397%2C%22first_name%22%3A%22John%22%2C%22username%22%3A%22john_doe%22%2C%22photo_url%22%3A%22https%3A%5C%2F%5C%2Ft.me%5C%2Fi%5C%2Fuserpic%5C%2F320%5C%2Fjohn_doe.jpg%22%7D&auth_date=1670000000&hash=abc123';

      const response = await request(app.getHttpServer())
        .post('/auth/telegram')
        .send({ initData })
        .expect(201);

      const user = await userRepository.findOne({ where: { id: response.body.user.id } });

      expect(user).toMatchObject({
        telegramId: 279058397,
        username: 'john_doe',
        balance: 0,
        role: 'player',
        status: 'active',
      });
      expect(user?.lastLogin).toBeInstanceOf(Date);
      expect(user?.createdAt).toBeInstanceOf(Date);
    });

    it('should maintain session across multiple requests with same token', async () => {
      const initData =
        'query_id=AAHdF6IQAAAAAN0XohDhrOrc&user=%7B%22id%22%3A279058397%2C%22username%22%3A%22john_doe%22%7D&auth_date=1670000000&hash=abc123';

      const authResponse = await request(app.getHttpServer())
        .post('/auth/telegram')
        .send({ initData })
        .expect(201);

      const token = authResponse.body.access_token;

      // First request with token
      const response1 = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Second request with same token
      const response2 = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response1.body.id).toBe(response2.body.id);
      expect(response1.body.username).toBe(response2.body.username);
    });
  });

  describe('Session validation', () => {
    beforeEach(async () => {
      const initData =
        'query_id=AAHdF6IQAAAAAN0XohDhrOrc&user=%7B%22id%22%3A279058397%2C%22username%22%3A%22john_doe%22%7D&auth_date=1670000000&hash=abc123';

      const response = await request(app.getHttpServer())
        .post('/auth/telegram')
        .send({ initData })
        .expect(201);

      authToken = response.body.access_token;
      userId = response.body.user.id;
    });

    it('should reject requests without token', async () => {
      await request(app.getHttpServer()).get('/auth/me').expect(401);
    });

    it('should reject requests with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should reject requests with tampered token', async () => {
      const tamperedToken = authToken.slice(0, -5) + 'xxxxx';

      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${tamperedToken}`)
        .expect(401);
    });

    it('should accept requests with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(userId);
    });
  });
});
