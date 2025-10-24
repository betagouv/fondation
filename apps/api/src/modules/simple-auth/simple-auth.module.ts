import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { SimpleAuthService } from './simple-auth.service';
import { SimpleAuthMiddleware } from './simple-auth.middleware';

@Module({
  providers: [SimpleAuthService],
  exports: [SimpleAuthService],
})
export class SimpleAuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SimpleAuthMiddleware).forRoutes('*all');
  }
}
