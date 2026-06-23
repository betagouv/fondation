import { HttpService } from '@nestjs/axios';
import { Logger, OnApplicationBootstrap } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import z from 'zod';

import { ApiConfig } from 'src/modules/framework/config';
import { Pretty } from 'src/utils/types';

import { OpenIdClaims } from './openid-claims';
import { Jwk, JwksSchema } from './openid.schema';

/** @internal */
export async function internalOpenIdConfigFactory(
  http: HttpService,
  config: Pick<ApiConfig, 'originUrl' | 'frontendOriginUrl'>,
  options: OpenIdOptions,
): Promise<OpenIdConfig> {
  const providerOptions = await InternalOpenIdProviderOptionsSchema.parseAsync(options);
  const asyncConfig = new DiscoveredOpenIdConfig(http, providerOptions, config);
  const proxy = new Proxy(asyncConfig, {
    get(target, property, receiver) {
      if (property === 'onApplicationBootstrap') {
        return target.onApplicationBootstrap.bind(target);
      }

      if (typeof property !== 'string') {
        return Reflect.get(target, property, receiver);
      }

      return target.get(property);
    },
  });

  return proxy as unknown as OpenIdConfig;
}

class DiscoveredOpenIdConfig implements OnApplicationBootstrap {
  private readonly logger = new Logger('OpenIdConfig');

  readonly redirectUrl: URL;
  readonly postLogoutRedirectUrl: URL;

  private readonly claims: OpenIdClaims | null;
  private discovered: InternalOpenIdDiscoveredConfig | undefined;

  constructor(
    private readonly http: HttpService,
    private readonly options: OpenIdOptions,
    config: Pick<ApiConfig, 'frontendOriginUrl' | 'originUrl'>,
  ) {
    this.claims = options.claims ? OpenIdClaims.from(options.claims) : null;
    this.redirectUrl = new URL(`${config.originUrl}/api/auth/v2/openid/${options.id}/callback`);
    this.postLogoutRedirectUrl = new URL(config.frontendOriginUrl);
  }

  get(key: string): unknown {
    if (key === 'urls') return { redirect: this.redirectUrl, postLogout: this.postLogoutRedirectUrl };
    if (key === 'claims') return this.claims;
    if (key in this.options) return (this.options as any)[key];
    if (this.discovered && key in this.discovered) return (this.discovered as any)[key];

    return undefined;
  }

  /** this is the main reason of this class: discovering the config before the app starts */
  async onApplicationBootstrap(): Promise<void> {
    const { data: configuration } = await lastValueFrom(this.http.get(this.options.wellKnown));
    const { jwksUri, supportedClaims, supportedScopes, ...metadata } =
      await InternalOpenIdDiscoveredSchema.parseAsync(configuration);

    this.claims?.assertIsSupported(supportedClaims);

    const unsupportedScopes = this.options.scopes.filter((scope) => !supportedScopes.has(scope));
    if (unsupportedScopes.length) {
      this.logger.error(`unsupported scopes ${unsupportedScopes.join(', ')}`);
      throw new UnsupportedOpenIdScopes(unsupportedScopes);
    }

    const { data: jwks } = await lastValueFrom(this.http.get(jwksUri.toString()));
    const { keys } = await JwksSchema.parseAsync(jwks);

    this.discovered = { ...metadata, keys };
  }
}

export class UnsupportedOpenIdScopes extends Error {
  constructor(readonly scopes: readonly string[]) {
    super();
  }
}

/** @internal user provided options for each provider */
const InternalOpenIdProviderOptionsSchema = z.object({
  /** the unique id of the provider */
  id: z.string().trim().nonempty(),
  /** usually in the form <base_url>/.well-known/openid-configuration */
  wellKnown: z.url(),
  clientId: z.string().trim().nonempty(),
  clientSecret: z.string().trim().nonempty(),
  scopes: z.array(z.string()).default([]),
  claims: OpenIdClaims.schema.optional(),
  acr: z.string().optional(),

  /** @default true if the configuration allows code challenge, it will be provided, unless disabled here */
  enableCodeChallenge: z.boolean().optional(),
});

/** @public */
export type OpenIdOptions = z.infer<typeof InternalOpenIdProviderOptionsSchema>;

/** @internal */
const InternalOpenIdDiscoveredSchema = z
  .object({
    issuer: z.string(),
    authorization_endpoint: z.url(),
    token_endpoint: z.url(),
    userinfo_endpoint: z.url(),
    jwks_uri: z.url(),
    claims_supported: z.array(z.string()).default([]),
    scopes_supported: z.array(z.string()).default([]),
    grant_types_supported: z.array(z.string()).default([]),
    code_challenge_methods_supported: z.array(z.string()).optional(),
  })
  .transform((x) => ({
    supportedClaims: new Set(x.claims_supported),
    supportedScopes: new Set(x.scopes_supported),
    supportedCodeChallengeMethods: x.code_challenge_methods_supported
      ? new Set(x.code_challenge_methods_supported)
      : null,
    jwksUri: new URL(x.jwks_uri),
    issuer: x.issuer,
    endpoints: {
      token: new URL(x.token_endpoint),
      authorization: new URL(x.authorization_endpoint),
      userInfo: new URL(x.userinfo_endpoint),
    },
  }));

/** @internal */
type InternalOpenIdConventionConfig = {
  urls: { redirect: URL; postLogout: URL };
};

/** @internal */
type InternalOpenIdDiscoveredConfig = {
  issuer: string;
  keys: readonly Jwk[];
  supportedCodeChallengeMethods: Set<string> | null;
  endpoints: { token: URL; authorization: URL; userInfo: URL };
};

export type OpenIdConfig = Pretty<
  Omit<OpenIdOptions, 'claims'> & { claims: OpenIdClaims | null } & InternalOpenIdDiscoveredConfig &
    InternalOpenIdConventionConfig
>;
