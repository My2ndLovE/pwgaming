import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class WsAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient<Socket>();

    try {
      // Extract token from handshake auth or query
      const token = this.extractToken(client);

      if (!token) {
        throw new WsException('No token provided');
      }

      // Verify JWT token
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'your-secret-key',
      });

      // Attach user info to socket
      client.data.user = payload;

      return true;
    } catch (error) {
      throw new WsException('Invalid or expired token');
    }
  }

  private extractToken(client: Socket): string | null {
    // Check authorization header
    const authHeader = client.handshake.auth?.token;
    if (authHeader) {
      return authHeader;
    }

    // Check query parameter
    const queryToken = client.handshake.query?.token as string;
    if (queryToken) {
      return queryToken;
    }

    // Check headers
    const headerToken = client.handshake.headers?.authorization;
    if (headerToken && headerToken.startsWith('Bearer ')) {
      return headerToken.substring(7);
    }

    return null;
  }
}
