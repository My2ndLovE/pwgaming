import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RefreshToken } from '../entities/refresh-token.entity';
import { User } from '../entities/user.entity';
import * as crypto from 'crypto';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class RefreshTokenService {
  private readonly REFRESH_TOKEN_EXPIRY_DAYS = 30;

  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Generate a new access token and refresh token pair
   */
  async generateTokenPair(
    user: User,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<TokenPair> {
    // Generate access token (short-lived)
    const accessToken = this.jwtService.sign({
      sub: user.id,
      telegramId: user.telegramId,
      username: user.username,
      role: user.role,
    });

    // Generate refresh token (long-lived)
    const refreshTokenString = this.generateSecureToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.REFRESH_TOKEN_EXPIRY_DAYS);

    // Save refresh token to database
    const refreshToken = this.refreshTokenRepository.create({
      token: refreshTokenString,
      userId: user.id,
      expiresAt,
      userAgent,
      ipAddress,
    });

    await this.refreshTokenRepository.save(refreshToken);

    // Get token expiration in seconds
    const jwtExpiration = this.configService.get<string>(
      'JWT_EXPIRATION',
      '7d',
    );
    const expiresIn = this.parseExpirationToSeconds(jwtExpiration);

    return {
      accessToken,
      refreshToken: refreshTokenString,
      expiresIn,
    };
  }

  /**
   * Refresh an access token using a refresh token
   */
  async refreshAccessToken(
    refreshTokenString: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<TokenPair> {
    // Find and validate refresh token
    const refreshToken = await this.refreshTokenRepository.findOne({
      where: { token: refreshTokenString },
      relations: ['user'],
    });

    if (!refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check if token is expired
    if (refreshToken.expiresAt < new Date()) {
      await this.revokeToken(refreshTokenString);
      throw new UnauthorizedException('Refresh token expired');
    }

    // Check if token is revoked
    if (refreshToken.isRevoked) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    // Check if user is still active
    if (refreshToken.user.status !== 'active') {
      await this.revokeToken(refreshTokenString);
      throw new UnauthorizedException('User account is not active');
    }

    // Update last used timestamp
    refreshToken.lastUsedAt = new Date();
    await this.refreshTokenRepository.save(refreshToken);

    // Generate new token pair
    return this.generateTokenPair(refreshToken.user, userAgent, ipAddress);
  }

  /**
   * Revoke a refresh token
   */
  async revokeToken(refreshTokenString: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { token: refreshTokenString },
      { isRevoked: true },
    );
  }

  /**
   * Revoke all refresh tokens for a user
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { userId, isRevoked: false },
      { isRevoked: true },
    );
  }

  /**
   * Clean up expired and revoked tokens (should be run periodically)
   */
  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.refreshTokenRepository.delete({
      expiresAt: LessThan(new Date()),
    });

    return result.affected || 0;
  }

  /**
   * Clean up revoked tokens older than 7 days
   */
  async cleanupRevokedTokens(): Promise<number> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const result = await this.refreshTokenRepository
      .createQueryBuilder()
      .delete()
      .where('isRevoked = :isRevoked', { isRevoked: true })
      .andWhere('createdAt < :date', { date: sevenDaysAgo })
      .execute();

    return result.affected || 0;
  }

  /**
   * Get active refresh tokens for a user
   */
  async getUserActiveTokens(userId: string): Promise<RefreshToken[]> {
    return this.refreshTokenRepository.find({
      where: {
        userId,
        isRevoked: false,
        expiresAt: LessThan(new Date()),
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  /**
   * Generate a cryptographically secure random token
   */
  private generateSecureToken(): string {
    return crypto.randomBytes(64).toString('base64url');
  }

  /**
   * Parse JWT expiration string to seconds
   */
  private parseExpirationToSeconds(expiration: string): number {
    const units: Record<string, number> = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    };

    const match = expiration.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 604800; // Default: 7 days
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    return value * (units[unit] || 1);
  }
}
