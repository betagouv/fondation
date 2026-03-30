import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { DetailsUserFromImpersonationQuery } from './infrastructure/queries/details-user-from-impesronation-id.query';
import { DetailsUserFromSessionIdQuery } from './infrastructure/queries/details-user-from-session-id.query';
import { DetailsUserQuery } from './infrastructure/queries/details-user.query';
import { FindMachineQuery } from './infrastructure/queries/find-machine.query';
import { ListUsersQuery } from './infrastructure/queries/list-users.query';
import { AuthUserRepository } from './infrastructure/repositories/auth-user.repository';
import { SimpleAuthController } from './simple-auth.controller';
import { SimpleAuthMiddleware } from './simple-auth.middleware';
import { SimpleAuthService } from './simple-auth.service';

@Module({
  controllers: [SimpleAuthController],
  providers: [
    AuthUserRepository,
    DetailsUserFromSessionIdQuery,
    DetailsUserFromImpersonationQuery,
    DetailsUserQuery,
    FindMachineQuery,
    ListUsersQuery,
    SimpleAuthService,
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

        '/api/reports/:id',
        '/api/reports/by-dn-id',
        '/api/reports/rules/:ruleId',
        '/api/reports/transparences',
        '/api/reports/:id/files/upload-many',
        '/api/reports/:id/files/byName/*rest',
        '/api/reports/:id/files/byNames',

        '/api/authz/*rest',
        '/api/data-administration/*rest',
        '/api/files/*rest',
        '/api/nominations/dossier-de-nominations/*rest',
        '/api/nominations/sessions{/*rest}',
        '/api/nominations/transparence/*rest',
        '/api/users/*rest',
      )
      .forRoutes('*all');
  }
}
