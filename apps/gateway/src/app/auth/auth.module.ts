import { Module } from '@nestjs/common';
import { ClerkGuard } from './guards/clerk.guard';

@Module({
  providers: [ClerkGuard],
  exports: [ClerkGuard],
})
export class AuthModule {}
