import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../../../src/modules/auth/auth.module';
import { User, UserRole, UserStatus } from '../../../src/modules/auth/entities/user.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('Profile Retrieval (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let authToken: string;
  let testUser: User;

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

    // Create and authenticate test user
    const initData =
      'query_id=AAHdF6IQAAAAAN0XohDhrOrc&user=%7B%22id%22%3A279058397%2C%22first_name%22%3A%22John%22%2C%22username%22%3A%22john_doe%22%2C%22photo_url%22%3A%22https%3A%5C%2F%5C%2Ft.me%5C%2Fi%5C%2Fuserpic%5C%2F320%5C%2Fjohn_doe.jpg%22%7D&auth_date=1670000000&hash=abc123';

    const response = await request(app.getHttpServer())
      .post('/auth/telegram')
      .send({ initData })
      .expect(201);

    authToken = response.body.access_token;
    testUser = await userRepository.findOne({ where: { id: response.body.user.id } }) as User;
  });

  describe('GET /auth/me', () => {
    it('should retrieve authenticated user profile', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: testUser.id,
        username: 'john_doe',
        role: UserRole.PLAYER,
        status: UserStatus.ACTIVE,
      });
    });

    it('should include all profile fields', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('username');
      expect(response.body).toHaveProperty('avatarUrl');
      expect(response.body).toHaveProperty('balance');
      expect(response.body).toHaveProperty('role');
      expect(response.body).toHaveProperty('status');
    });

    it('should return correct balance', async () => {
      // Update user balance
      testUser.balance = 1500;
      await userRepository.save(testUser);

      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.balance).toBe(1500);
    });

    it('should return correct avatarUrl', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.avatarUrl).toContain('john_doe.jpg');
    });

    it('should return null avatarUrl if not set', async () => {
      // Create user without avatar
      const initData =
        'query_id=AAHdF6IQAAAAAN0XohDhrOrc&user=%7B%22id%22%3A123456789%2C%22username%22%3A%22jane_doe%22%7D&auth_date=1670000000&hash=abc123';

      const authResponse = await request(app.getHttpServer())
        .post('/auth/telegram')
        .send({ initData })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${authResponse.body.access_token}`)
        .expect(200);

      expect(response.body.avatarUrl).toBeNull();
    });

    it('should return PLAYER role for regular users', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.role).toBe(UserRole.PLAYER);
    });

    it('should return ADMIN role for admin users', async () => {
      // Update user to admin
      testUser.role = UserRole.ADMIN;
      await userRepository.save(testUser);

      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.role).toBe(UserRole.ADMIN);
    });

    it('should return ACTIVE status for active users', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toBe(UserStatus.ACTIVE);
    });

    it('should return SUSPENDED status for suspended users', async () => {
      // Suspend user
      testUser.status = UserStatus.SUSPENDED;
      testUser.suspensionReason = 'Test suspension';
      await userRepository.save(testUser);

      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toBe(UserStatus.SUSPENDED);
    });

    it('should reject unauthenticated requests', async () => {
      await request(app.getHttpServer()).get('/auth/me').expect(401);
    });

    it('should reject requests with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should reject requests with expired token', async () => {
      // This test would require creating a token with very short expiry
      // For now, we test with tampered token
      const tamperedToken = authToken.slice(0, -5) + 'xxxxx';

      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${tamperedToken}`)
        .expect(401);
    });

    it('should not expose sensitive information', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Should not include telegramId, createdAt, updatedAt, etc.
      expect(response.body).not.toHaveProperty('telegramId');
      expect(response.body).not.toHaveProperty('createdAt');
      expect(response.body).not.toHaveProperty('updatedAt');
    });

    it('should return consistent data across multiple requests', async () => {
      const response1 = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const response2 = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response1.body).toEqual(response2.body);
    });
  });
});
