import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

interface AuthRequest extends Express.Request {
  user?: {
    role: string;
    userId: string;
  };
}

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const user = request.user;

    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      throw new ForbiddenException('Admin access required');
    }

    return true;
  }
}
