import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class InAppNotificationsService {
  constructor(private prisma: PrismaService) {}

  async createForAllUsers(type: string, title: string, body: string) {
    const users = await this.prisma.user.findMany({ select: { id: true } });
    if (users.length === 0) return;
    await this.prisma.inAppNotification.createMany({
      data: users.map((u) => ({ userId: u.id, type, title, body })),
    });
  }

  async findAllForUser(userId: string) {
    return this.prisma.inAppNotification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async markRead(userId: string, id: string) {
    return this.prisma.inAppNotification.updateMany({
      where: { id, userId },
      data: { read: true },
    });
  }

  async markAllRead(userId: string) {
    return this.prisma.inAppNotification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }
}
