import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';

describe('JwtService', () => {
  let service: JwtService;
  const mockSecret = 'test-secret-key';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: JwtService,
          useValue: new JwtService({
            secret: mockSecret,
            signOptions: { expiresIn: '7d' },
          }),
        },
      ],
    }).compile();

    service = module.get<JwtService>(JwtService);
  });

  describe('sign', () => {
    it('should sign a payload and return a token', () => {
      const payload = {
        sub: '123e4567-e89b-12d3-a456-426614174000',
        telegramId: 279058397,
        role: 'player',
      };

      const token = service.sign(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should create different tokens for different payloads', () => {
      const payload1 = { sub: 'user1', role: 'player' };
      const payload2 = { sub: 'user2', role: 'admin' };

      const token1 = service.sign(payload1);
      const token2 = service.sign(payload2);

      expect(token1).not.toBe(token2);
    });

    it('should include expiration time in token', () => {
      const payload = { sub: 'user1' };
      const token = service.sign(payload);
      const decoded = service.decode(token);

      expect(decoded.exp).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });
  });

  describe('verify', () => {
    it('should verify a valid token', () => {
      const payload = {
        sub: '123e4567-e89b-12d3-a456-426614174000',
        telegramId: 279058397,
        role: 'player',
      };

      const token = service.sign(payload);
      const decoded = service.verify(token);

      expect(decoded).toMatchObject(payload);
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
    });

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => service.verify(invalidToken)).toThrow();
    });

    it('should throw error for tampered token', () => {
      const payload = { sub: 'user1', role: 'player' };
      const token = service.sign(payload);

      // Tamper with the token
      const parts = token.split('.');
      const tamperedToken = parts[0] + '.tampered.' + parts[2];

      expect(() => service.verify(tamperedToken)).toThrow();
    });

    it('should throw error for token signed with different secret', () => {
      const otherService = new JwtService({
        secret: 'different-secret',
        signOptions: { expiresIn: '7d' },
      });

      const payload = { sub: 'user1' };
      const token = otherService.sign(payload);

      expect(() => service.verify(token)).toThrow();
    });

    it('should throw error for expired token', () => {
      const shortLivedService = new JwtService({
        secret: mockSecret,
        signOptions: { expiresIn: '0s' }, // Already expired
      });

      const payload = { sub: 'user1' };
      const token = shortLivedService.sign(payload);

      // Wait a bit to ensure expiration
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(() => service.verify(token)).toThrow();
          resolve();
        }, 100);
      });
    });
  });

  describe('decode', () => {
    it('should decode a token without verification', () => {
      const payload = {
        sub: '123e4567-e89b-12d3-a456-426614174000',
        telegramId: 279058397,
        role: 'player',
      };

      const token = service.sign(payload);
      const decoded = service.decode(token);

      expect(decoded).toMatchObject(payload);
    });

    it('should decode token even if signature is invalid', () => {
      const payload = { sub: 'user1' };
      const token = service.sign(payload);

      // Tamper with signature
      const parts = token.split('.');
      const tamperedToken = parts[0] + '.' + parts[1] + '.tampered';

      const decoded = service.decode(tamperedToken);
      expect(decoded).toBeTruthy();
      expect(decoded.sub).toBe('user1');
    });

    it('should return null for invalid token format', () => {
      const invalidToken = 'not-a-jwt';
      const decoded = service.decode(invalidToken);

      expect(decoded).toBeNull();
    });
  });
});
