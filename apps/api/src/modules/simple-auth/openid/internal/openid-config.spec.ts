import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { vi, type Mock } from 'vitest';

import { internalOpenIdConfigFactory, OpenIdConfig } from './openid-config';

const ISSUER = 'https://issuer.test';
const WELL_KNOWN = `${ISSUER}/.well-known/openid-configuration`;

describe('OpenIdConfig', () => {
  async function makeConfig(http: { get?: Mock } = {}): Promise<OpenIdConfig> {
    return internalOpenIdConfigFactory(
      http as unknown as HttpService,
      {
        originUrl: 'https://api.fondation.test',
        frontendOriginUrl: 'https://front.fondation.test',
      },
      {
        id: 'proConnect',
        clientId: 'client-id',
        clientSecret: 'client-secret',
        wellKnown: WELL_KNOWN,
        scopes: ['openid', 'email'],
      },
    );
  }

  it('should expose the normalized metadata fetched from the discovery and jwks endpoints', async () => {
    const get = vi.fn().mockImplementation((url: string) =>
      of({
        data: url.endsWith('/jwks')
          ? { keys: [{ kty: 'RSA', kid: 'key-1' }] }
          : {
              issuer: ISSUER,
              authorization_endpoint: `${ISSUER}/authorize`,
              token_endpoint: `${ISSUER}/token`,
              userinfo_endpoint: `${ISSUER}/userinfo`,
              jwks_uri: `${ISSUER}/jwks`,
              end_session_endpoint: `${ISSUER}/session/end`,
              scopes_supported: ['openid', 'email'],
            },
      }),
    );

    const config = await makeConfig({ get });

    // Nest will make this check
    expect('onApplicationBootstrap' in config).toBe(true);
    await (config as any).onApplicationBootstrap();

    // CONVENTIONAL
    expect(config.urls.postLogout.toString()).toBe(`https://front.fondation.test/`);
    expect(config.urls.redirect.toString()).toBe(
      `https://api.fondation.test/api/auth/v2/openid/proConnect/callback`,
    );

    // USER PROVIDED
    expect(config.id).toBe('proConnect');
    expect(config.issuer).toBe(ISSUER);

    // DISCOVERED
    expect(config.keys).toEqual([{ kty: 'RSA', kid: 'key-1' }]);
    expect(config.endpoints.authorization.toString()).toBe(`${ISSUER}/authorize`);
    expect(config.endpoints.token.toString()).toBe(`${ISSUER}/token`);
    expect(config.endpoints.userInfo.toString()).toBe(`${ISSUER}/userinfo`);
  });

  it('should be undefined when accessing discovered data before discovery', async () => {
    const config = await makeConfig();
    expect(config.keys).toBeUndefined();
  });
});
