import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { WsException } from '@nestjs/websockets';
import { WsAuthGuard } from '../../../src/modules/realtime/guards/ws-auth.guard';
import { ExecutionContext } from '@nestjs/common';
import { Socket } from 'socket.io';

describe('WsAuthGuard', () => {
  let guard: WsAuthGuard;
  let jwtService: JwtService;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn(),
    };

    const mockJwtService = {
      verifyAsync: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WsAuthGuard,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    guard = module.get<WsAuthGuard>(WsAuthGuard);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get(ConfigService);
  });

  describe('Security - JWT Secret Configuration', () => {
    it('should throw WsException when JWT_SECRET is not configured', async () => {
      // RED: This test should FAIL because current implementation uses hardcoded fallback
      configService.get.mockReturnValue(undefined);

      const mockSocket = {
        handshake: {
          auth: { token: 'test-token' },
          query: {},
          headers: {},
        },
        data: {},
      } as unknown as Socket;

      const mockContext = {
        switchToWs: () => ({
          getClient: () => mockSocket,
        }),
      } as ExecutionContext;

      // This should throw because JWT_SECRET is not set
      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        new WsException('JWT_SECRET not configured'),
      );
    });

    it('should use ConfigService to get JWT_SECRET', async () => {
      configService.get.mockReturnValue('test-secret');

      const mockPayload = { sub: '123', username: 'test' };
      (jwtService.verifyAsync as jest.Mock).mockResolvedValue(mockPayload);

      const mockSocket = {
        handshake: {
          auth: { token: 'valid-token' },
          query: {},
          headers: {},
        },
        data: {},
      } as unknown as Socket;

      const mockContext = {
        switchToWs: () => ({
          getClient: () => mockSocket,
        }),
      } as ExecutionContext;

      await guard.canActivate(mockContext);

      expect(configService.get).toHaveBeenCalledWith('JWT_SECRET');
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-token', {
        secret: 'test-secret',
      });
    });
  });

  describe('Token Validation', () => {
    beforeEach(() => {
      configService.get.mockReturnValue('test-secret');
    });

    it('should throw WsException when no token provided', async () => {
      const mockSocket = {
        handshake: {
          auth: {},
          query: {},
          headers: {},
        },
        data: {},
      } as unknown as Socket;

      const mockContext = {
        switchToWs: () => ({
          getClient: () => mockSocket,
        }),
      } as ExecutionContext;

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        new WsException('No token provided'),
      );
    });

    it('should accept valid token from auth.token', async () => {
      const mockPayload = { sub: '123', username: 'test' };
      (jwtService.verifyAsync as jest.Mock).mockResolvedValue(mockPayload);

      const mockSocket = {
        handshake: {
          auth: { token: 'valid-token' },
          query: {},
          headers: {},
        },
        data: {},
      } as unknown as Socket;

      const mockContext = {
        switchToWs: () => ({
          getClient: () => mockSocket,
        }),
      } as ExecutionContext;

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(mockSocket.data.user).toEqual(mockPayload);
    });

    it('should accept valid token from query parameter', async () => {
      const mockPayload = { sub: '123', username: 'test' };
      (jwtService.verifyAsync as jest.Mock).mockResolvedValue(mockPayload);

      const mockSocket = {
        handshake: {
          auth: {},
          query: { token: 'valid-token' },
          headers: {},
        },
        data: {},
      } as unknown as Socket;

      const mockContext = {
        switchToWs: () => ({
          getClient: () => mockSocket,
        }),
      } as ExecutionContext;

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should accept valid token from Authorization header', async () => {
      const mockPayload = { sub: '123', username: 'test' };
      (jwtService.verifyAsync as jest.Mock).mockResolvedValue(mockPayload);

      const mockSocket = {
        handshake: {
          auth: {},
          query: {},
          headers: { authorization: 'Bearer valid-token' },
        },
        data: {},
      } as unknown as Socket;

      const mockContext = {
        switchToWs: () => ({
          getClient: () => mockSocket,
        }),
      } as ExecutionContext;

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should throw WsException for invalid token', async () => {
      (jwtService.verifyAsync as jest.Mock).mockRejectedValue(
        new Error('Invalid token'),
      );

      const mockSocket = {
        handshake: {
          auth: { token: 'invalid-token' },
          query: {},
          headers: {},
        },
        data: {},
      } as unknown as Socket;

      const mockContext = {
        switchToWs: () => ({
          getClient: () => mockSocket,
        }),
      } as ExecutionContext;

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        new WsException('Invalid or expired token'),
      );
    });
  });
});
