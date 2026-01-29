import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { TenantContextMiddleware } from './tenant-context.middleware';

@Module({
  controllers: [AuthController],
  providers: [TenantContextMiddleware],
  exports: [TenantContextMiddleware],
})
export class AuthModule {}
