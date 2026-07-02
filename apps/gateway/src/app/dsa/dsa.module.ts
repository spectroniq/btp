import { Module } from '@nestjs/common';
import { DsaController } from './dsa.controller';
import { DsaService } from './dsa.service';
import { PrismaModule } from '../../shared/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DsaController],
  providers: [DsaService],
})
export class DsaModule {}
