import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { TenantContextMiddleware } from './tenant-context.middleware';

@Module({
  controllers: [AuthController],
  providers: [TenantContextMiddleware],
  exports: [TenantContextMiddleware],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantContextMiddleware).forRoutes('*'); // Apply to all routes
  }
}
