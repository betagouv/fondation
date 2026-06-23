import { generateKeyPairSync, KeyObject, sign as signData } from 'node:crypto';

import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';

import { Clock } from 'src/modules/framework/clock';

import { type OpenIdConfig } from './openid-config';
import { Jwk } from './openid.schema';
import { InternalOpenIdService } from './openid.service';

const ISSUER = 'https://issuer.test';
const NOW = new Date('2026-06-18T00:00:00.000Z');

function base64url(value: object): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function signJwt(privateKey: KeyObject, payload: Record<string, unknown>): string {
  const header = base64url({ alg: 'RS256', kid: 'key-1' });
  const body = base64url({ exp: Math.floor(NOW.getTime() / 1000) + 60, ...payload });
  const signature = signData('sha256', Buffer.from(`${header}.${body}`), privateKey).toString('base64url');

  return `${header}.${body}.${signature}`;
}

describe('OpenIdService', () => {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const jwk: Jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'key-1', alg: 'RS256' } as Jwk;

  const openIdConfig = {
    issuer: ISSUER,
    id: 'test-openid',
    urls: {
      redirect: new URL('https://api.test/api/openid/callback/test-openid'),
      postLogout: new URL('https://api.test/api/openid/callback/test-openid'),
    },
    endpoints: {
      token: new URL('/api/v2/token', ISSUER),
      userInfo: new URL('/api/v2/userinfo', ISSUER),
      authorization: new URL('/api/v2/authorize', ISSUER),
    },
    keys: [jwk],
    acr: 'eidas1',
    scopes: ['openid', 'email'],
    clientId: 'client-id',
    clientSecret: 'client-secret',
    claims: null,
    supportedCodeChallengeMethods: new Set(['S256']),
    wellKnown: new URL('/api/v2/.well-known/openid-configuration', ISSUER).toString(),
  } satisfies OpenIdConfig;
  const clock = { now: () => NOW } as Clock;

  function makeService(http: Partial<HttpService>): InternalOpenIdService {
    return new InternalOpenIdService(openIdConfig, http as HttpService, clock);
  }

  describe('createAuthorization', () => {
    it('returns an OpenIdAuthenticationRequest with a valid authorization url', () => {
      const service = makeService({});
      const request = service.request();
      const params = new URL(request.authorizationUrl!).searchParams;

      expect(request.provider).toBe('test-openid');
      expect(request.authorizationUrl).toBeDefined();
      expect(request.state).toBeDefined();
      expect(request.state.nonce).toBeDefined();
      expect(request.state.challenge?.toHashString()).toBeDefined();

      expect(params.get('response_type')).toBe('code');
      expect(params.get('client_id')).toBe('client-id');
      expect(params.get('redirect_uri')).toBe('https://api.test/api/openid/callback/test-openid');
      expect(params.get('scope')).toBe('openid email');
      expect(params.get('code_challenge_method')).toBe('S256');
      expect(params.get('acr_values')).toBe('eidas1');
    });
  });

  describe('authenticate', () => {
    it('exchanges the code, verifies the tokens and returns the email', async () => {
      const httpRequest = jest.fn();
      const get = jest.fn();
      const service = makeService({ request: httpRequest, get });
      const request = service.request();

      const nonce = request.state.nonce.toString('base64url');
      const idToken = signJwt(privateKey, { iss: ISSUER, aud: 'client-id', sub: 'user-1', nonce });
      const userinfo = signJwt(privateKey, {
        iss: ISSUER,
        aud: 'client-id',
        sub: 'user-1',
        email: 'agent@justice.gouv.fr',
      });

      httpRequest.mockReturnValue(of({ data: { access_token: 'at', id_token: idToken } }));
      get.mockReturnValue(of({ data: userinfo }));

      const result = await service.authenticate({
        code: 'the-code',
        request: {
          id: request.id,
          nonce: request.state.nonce,
          challenge: request.state.challenge?.toBuffer() ?? null,
          createdAt: request.state.createdAt,
          expiresAt: request.state.expiresAt,
        },
      });

      expect(result).toEqual({ email: 'agent@justice.gouv.fr' });
      const body = new URLSearchParams(httpRequest.mock.calls[0][0].data);
      expect(body.get('grant_type')).toBe('authorization_code');
      expect(body.get('code')).toBe('the-code');
      expect(body.get('code_verifier')).toBe(request.state.challenge?.toString());
    });
  });
});
