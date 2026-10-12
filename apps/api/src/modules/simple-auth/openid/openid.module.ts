import { HttpService } from '@nestjs/axios';
import { DynamicModule, FactoryProvider, Module, Provider } from '@nestjs/common';

import { Clock } from 'src/modules/framework/clock';
import { API_CONFIG_TOKEN, ApiConfig } from 'src/modules/framework/config';

import { internalOpenIdConfigFactory, OpenIdConfig, OpenIdOptions } from './internal/openid-config';
import { InternalOpenIdService } from './internal/openid.service';
import { internalOpenIdTokens } from './internal/openid.tokens';
import { OpenId } from './openid';
import { OpenIdProvider } from './openid.provider';

export type OpenIdProviderOptions = Omit<OpenIdOptions, 'id'>;
type OpenIdOptionsFactory = Omit<FactoryProvider<OpenIdProviderOptions | null>, 'provide'> & {
  id: OpenIdProvider;
};

@Module({})
export class OpenIdModule {
  static forRoot(...providers: readonly OpenIdOptionsFactory[]): DynamicModule {
    return {
      module: OpenIdModule,
      exports: [OpenId],
      providers: ([OpenId] as Provider[]).concat(providers.flatMap((provider) => this.register(provider))),
    };
  }

  private static register(options: OpenIdOptionsFactory): Provider[] {
    const { id, ...optionsFactory } = options;

    return [
      {
        provide: internalOpenIdTokens.userOptions(id),
        inject: [...(optionsFactory.inject ?? [])],
        useFactory: async (...deps: unknown[]): Promise<OpenIdOptions | null> => {
          const config = await optionsFactory.useFactory(...deps);
          return config ? { ...config, id } : null;
        },
      },
      {
        provide: internalOpenIdTokens.config(id),
        inject: [HttpService, API_CONFIG_TOKEN, internalOpenIdTokens.userOptions(id)],
        useFactory: (http: HttpService, config: ApiConfig, providerOptions: OpenIdOptions | null) =>
          providerOptions ? internalOpenIdConfigFactory(http, config, providerOptions) : null,
      },
      {
        provide: internalOpenIdTokens.client(id),
        inject: [internalOpenIdTokens.config(id), HttpService, Clock],
        useFactory: (config: OpenIdConfig | null, http: HttpService, clock: Clock) =>
          config ? new InternalOpenIdService(config, http, clock) : null,
      },
    ];
  }
}
