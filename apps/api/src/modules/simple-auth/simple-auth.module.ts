import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { API_CONFIG_TOKEN, ApiConfig } from 'src/modules/framework/config';

import { OpenIdAuthenticationRequestFinder } from './infrastructure/finders/openid-authentication-request.finder';
import { OpenIdAuthController } from './infrastructure/openid-auth.controller';
import { DetailsUserFromImpersonationQuery } from './infrastructure/queries/details-user-from-impesronation-id.query';
import { DetailsUserFromSessionIdQuery } from './infrastructure/queries/details-user-from-session-id.query';
import { DetailsUserQuery } from './infrastructure/queries/details-user.query';
import { FindMachineQuery } from './infrastructure/queries/find-machine.query';
import { ListOpenIdProvidersQuery } from './infrastructure/queries/list-openid-providers.query';
import { ListUsersQuery } from './infrastructure/queries/list-users.query';
import { AuthUserRepository } from './infrastructure/repositories/auth-user.repository';
import { OpenIdModule, OpenIdProviderOptions } from './openid';
import { OpenIdAuthService } from './openid-auth.service';
import { SimpleAuthController } from './simple-auth.controller';
import { SimpleAuthMiddleware } from './simple-auth.middleware';
import { SimpleAuthService } from './simple-auth.service';

@Module({
  imports: [
    OpenIdModule.forRoot({
      id: 'pro-connect',
      inject: [API_CONFIG_TOKEN],
      useFactory: (config: ApiConfig): OpenIdProviderOptions | null => {
        if (!config.proConnect) return null;

        return {
          clientId: config.proConnect.clientId,
          clientSecret: config.proConnect.clientSecret,
          wellKnown: new URL('/api/v2/.well-known/openid-configuration', config.proConnect.domain).toString(),
          scopes: ['openid', 'given_name', 'usual_name', 'email'],
          enableCodeChallenge: false,
        };
      },
    }),
  ],
  controllers: [SimpleAuthController, OpenIdAuthController],
  providers: [
    AuthUserRepository,
    DetailsUserFromImpersonationQuery,
    DetailsUserFromSessionIdQuery,
    DetailsUserQuery,
    FindMachineQuery,
    ListOpenIdProvidersQuery,
    ListUsersQuery,
    OpenIdAuthenticationRequestFinder,
    OpenIdAuthService,
    SimpleAuthService,
  ],
  exports: [SimpleAuthService],
})
export class SimpleAuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SimpleAuthMiddleware).forRoutes('*all');
  }
}
