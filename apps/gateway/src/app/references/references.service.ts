import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class ReferencesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.reference.findMany({
      orderBy: [{ category: 'asc' }, { order: 'asc' }],
    });
  }

  findByCategory(category: string) {
    return this.prisma.reference.findMany({
      where: { category },
      orderBy: { order: 'asc' },
    });
  }
}
