import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { verifyToken } from '@clerk/backend';
import { IS_PUBLIC } from '../decorators/public.decorator';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class ClerkGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing token');
    }

    const token = authHeader.split(' ')[1];

    try {
      const payload = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });

      await this.prisma.user.upsert({
        where: { id: payload.sub },
        create: { id: payload.sub, email: `${payload.sub}@clerk.local`, name: 'User', username: payload.sub },
        update: { lastSeen: new Date() },
      });

      request.userId = payload.sub;
      request.sessionId = payload.sid;
      request.orgId = payload.org_id;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
