import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { SimpleAuthService } from './simple-auth.service';
import { SimpleAuthMiddleware } from './simple-auth.middleware';

@Module({
  providers: [SimpleAuthService],
  exports: [SimpleAuthService],
})
export class SimpleAuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SimpleAuthMiddleware)
      .exclude(
        // all "legacy" controllers
        '/api/auth/*rest',
        '/api/authz/*rest',
        '/api/data-administration/*rest',
        '/api/files/*rest',
        '/api/nominations/dossier-de-nominations/*rest',
        '/api/nominations/sessions{/*rest}',
        '/api/reports/*rest',
        '/api/users/*rest',
      )
      .forRoutes('*');
  }
}
