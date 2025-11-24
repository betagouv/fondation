import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { SimpleAuthService } from './simple-auth.service';
import { SimpleAuthMiddleware } from './simple-auth.middleware';
import { SimpleAuthController } from './simple-auth.controller';
import { DetailsUserQuery } from './infrastructure/queries/details-user.query';
import { DetailsUserFromSessionIdQuery } from './infrastructure/queries/details-user-from-session-id.query';
import { AuthUserRepository } from './infrastructure/repositories/auth-user.repository';

@Module({
  controllers: [SimpleAuthController],
  providers: [
    SimpleAuthService,
    DetailsUserQuery,
    DetailsUserFromSessionIdQuery,
    AuthUserRepository,
  ],
  exports: [SimpleAuthService],
})
export class SimpleAuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SimpleAuthMiddleware)
      .exclude(
        // all "legacy" controllers
        '/api/auth/login',
        '/api/auth/logout',
        '/api/auth/user-*rest',
        '/api/auth/validate-*rest',

        '/api/authz/*rest',
        '/api/data-administration/*rest',
        '/api/files/*rest',
        '/api/nominations/dossier-de-nominations/*rest',
        '/api/nominations/sessions{/*rest}',
        '/api/nominations/transparence/*rest',
        '/api/reports/*rest',
        '/api/users/*rest',
      )
      .forRoutes('*all');
  }
}
