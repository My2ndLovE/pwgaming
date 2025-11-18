import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../../../src/modules/auth/auth.module';
import { User } from '../../../src/modules/auth/entities/user.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('Authentication Flow (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;

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

    userRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User),
    );
  });

  afterAll(async () => {
    await userRepository.query('DELETE FROM users');
    await app.close();
  });

  beforeEach(async () => {
    await userRepository.query('DELETE FROM users');
  });

  describe('Complete authentication flow', () => {
    it('should register new user, authenticate, and access protected route', async () => {
      const initData =
        'query_id=AAHdF6IQAAAAAN0XohDhrOrc&user=%7B%22id%22%3A279058397%2C%22first_name%22%3A%22John%22%2C%22username%22%3A%22john_doe%22%7D&auth_date=1670000000&hash=abc123';

      // Step 1: Authenticate (creates new user)
      const authResponse = await request(app.getHttpServer())
        .post('/auth/telegram')
        .send({ initData })
        .expect(201);

      expect(authResponse.body).toHaveProperty('access_token');
      expect(authResponse.body).toHaveProperty('user');
      expect(authResponse.body.user.username).toBe('john_doe');

      const token = authResponse.body.access_token;

      // Step 2: Verify user exists in database
      const users = await userRepository.find();
      expect(users).toHaveLength(1);
      expect(users[0].telegramId).toBe(279058397);

      // Step 3: Access protected profile endpoint
      const profileResponse = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(profileResponse.body).toMatchObject({
        id: authResponse.body.user.id,
        username: 'john_doe',
        role: 'player',
        status: 'active',
      });
    });

    it('should return existing user on repeat authentication', async () => {
      const initData =
        'query_id=AAHdF6IQAAAAAN0XohDhrOrc&user=%7B%22id%22%3A279058397%2C%22username%22%3A%22john_doe%22%7D&auth_date=1670000000&hash=abc123';

      // First authentication
      const firstAuth = await request(app.getHttpServer())
        .post('/auth/telegram')
        .send({ initData })
        .expect(201);

      // Second authentication with same user
      const secondAuth = await request(app.getHttpServer())
        .post('/auth/telegram')
        .send({ initData })
        .expect(201);

      // Should return same user ID
      expect(firstAuth.body.user.id).toBe(secondAuth.body.user.id);

      // Should only have one user in database
      const users = await userRepository.find();
      expect(users).toHaveLength(1);
    });

    it('should handle multiple users', async () => {
      const user1InitData =
        'query_id=AAHdF6IQAAAAAN0XohDhrOrc&user=%7B%22id%22%3A111111%2C%22username%22%3A%22user1%22%7D&auth_date=1670000000&hash=abc123';
      const user2InitData =
        'query_id=AAHdF6IQAAAAAN0XohDhrOrc&user=%7B%22id%22%3A222222%2C%22username%22%3A%22user2%22%7D&auth_date=1670000000&hash=abc123';

      // Authenticate user 1
      const auth1 = await request(app.getHttpServer())
        .post('/auth/telegram')
        .send({ initData: user1InitData })
        .expect(201);

      // Authenticate user 2
      const auth2 = await request(app.getHttpServer())
        .post('/auth/telegram')
        .send({ initData: user2InitData })
        .expect(201);

      expect(auth1.body.user.username).toBe('user1');
      expect(auth2.body.user.username).toBe('user2');
      expect(auth1.body.user.id).not.toBe(auth2.body.user.id);

      // Verify both users exist
      const users = await userRepository.find();
      expect(users).toHaveLength(2);

      // User 1 should only see their profile
      const profile1 = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${auth1.body.access_token}`)
        .expect(200);

      expect(profile1.body.username).toBe('user1');

      // User 2 should only see their profile
      const profile2 = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${auth2.body.access_token}`)
        .expect(200);

      expect(profile2.body.username).toBe('user2');
    });

    it('should reject access to protected routes without authentication', async () => {
      await request(app.getHttpServer()).get('/auth/me').expect(401);
    });

    it('should reject access with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid-token-here')
        .expect(401);
    });

    it('should properly handle user with avatar', async () => {
      const initData =
        'query_id=AAHdF6IQAAAAAN0XohDhrOrc&user=%7B%22id%22%3A279058397%2C%22username%22%3A%22john_doe%22%2C%22photo_url%22%3A%22https%3A%2F%2Ft.me%2Fi%2Fuserpic%2F320%2Fjohn.jpg%22%7D&auth_date=1670000000&hash=abc123';

      const authResponse = await request(app.getHttpServer())
        .post('/auth/telegram')
        .send({ initData })
        .expect(201);

      const profileResponse = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${authResponse.body.access_token}`)
        .expect(200);

      expect(profileResponse.body.avatarUrl).toContain('john.jpg');
    });

    it('should initialize new user with zero balance', async () => {
      const initData =
        'query_id=AAHdF6IQAAAAAN0XohDhrOrc&user=%7B%22id%22%3A279058397%2C%22username%22%3A%22john_doe%22%7D&auth_date=1670000000&hash=abc123';

      const authResponse = await request(app.getHttpServer())
        .post('/auth/telegram')
        .send({ initData })
        .expect(201);

      expect(authResponse.body.user.balance).toBe(0);

      const profileResponse = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${authResponse.body.access_token}`)
        .expect(200);

      expect(profileResponse.body.balance).toBe(0);
    });

    it('should initialize new user with PLAYER role', async () => {
      const initData =
        'query_id=AAHdF6IQAAAAAN0XohDhrOrc&user=%7B%22id%22%3A279058397%2C%22username%22%3A%22john_doe%22%7D&auth_date=1670000000&hash=abc123';

      const authResponse = await request(app.getHttpServer())
        .post('/auth/telegram')
        .send({ initData })
        .expect(201);

      expect(authResponse.body.user.role).toBe('player');
    });

    it('should initialize new user with ACTIVE status', async () => {
      const initData =
        'query_id=AAHdF6IQAAAAAN0XohDhrOrc&user=%7B%22id%22%3A279058397%2C%22username%22%3A%22john_doe%22%7D&auth_date=1670000000&hash=abc123';

      const authResponse = await request(app.getHttpServer())
        .post('/auth/telegram')
        .send({ initData })
        .expect(201);

      const profileResponse = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${authResponse.body.access_token}`)
        .expect(200);

      expect(profileResponse.body.status).toBe('active');
    });

    it('should generate valid JWT token with correct payload', async () => {
      const initData =
        'query_id=AAHdF6IQAAAAAN0XohDhrOrc&user=%7B%22id%22%3A279058397%2C%22username%22%3A%22john_doe%22%7D&auth_date=1670000000&hash=abc123';

      const authResponse = await request(app.getHttpServer())
        .post('/auth/telegram')
        .send({ initData })
        .expect(201);

      const token = authResponse.body.access_token;

      // Token should have 3 parts (header.payload.signature)
      expect(token.split('.')).toHaveLength(3);

      // Should be able to use token immediately
      const profileResponse = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(profileResponse.body.id).toBe(authResponse.body.user.id);
    });
  });

  describe('Token expiry and refresh', () => {
    it('should accept valid non-expired token', async () => {
      const initData =
        'query_id=AAHdF6IQAAAAAN0XohDhrOrc&user=%7B%22id%22%3A279058397%2C%22username%22%3A%22john_doe%22%7D&auth_date=1670000000&hash=abc123';

      const authResponse = await request(app.getHttpServer())
        .post('/auth/telegram')
        .send({ initData })
        .expect(201);

      // Use token immediately - should work
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${authResponse.body.access_token}`)
        .expect(200);

      // Use same token again - should still work
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${authResponse.body.access_token}`)
        .expect(200);
    });

    it('should allow re-authentication to get new token', async () => {
      const initData =
        'query_id=AAHdF6IQAAAAAN0XohDhrOrc&user=%7B%22id%22%3A279058397%2C%22username%22%3A%22john_doe%22%7D&auth_date=1670000000&hash=abc123';

      // First authentication
      const auth1 = await request(app.getHttpServer())
        .post('/auth/telegram')
        .send({ initData })
        .expect(201);

      // Re-authenticate
      const auth2 = await request(app.getHttpServer())
        .post('/auth/telegram')
        .send({ initData })
        .expect(201);

      // Both tokens should work
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${auth1.body.access_token}`)
        .expect(200);

      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${auth2.body.access_token}`)
        .expect(200);
    });
  });
});
