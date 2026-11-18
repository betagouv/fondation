import * as time from '../../../utils/time';

import {
  ApiClient,
  ApiClientForbidden,
  ApiClientUnauthenticated,
  ApiScope,
  IssuedAccessToken,
} from './api-client';

describe('ApiClient', () => {
  const now = new Date('2026-11-18T10:00:00Z');
  const { hash: secretHash, secret } = ApiClient.generateSecret();

  const client = (props: { allowedIps?: string[]; revokedAt?: Date; scopes?: string[] } = {}) =>
    new ApiClient({
      allowedIps: ['203.0.113.7'],
      id: 'client-1',
      revokedAt: null,
      scopes: ['magistrats:identification'],
      secretHash,
      ...props,
    });

  describe('authenticate', () => {
    const authenticate = (
      authenticated: ApiClient,
      command: { ip?: string; secret?: string } = {},
    ): IssuedAccessToken => authenticated.authenticate({ ip: '203.0.113.7', now, secret, ...command });

    it('should issue a token of fifteen minutes, known by its hash only', () => {
      const issued = authenticate(client());

      expect(issued).toEqual({
        expiresAt: new Date('2026-11-18T10:15:00Z'),
        expiresIn: 900,
        hash: ApiClient.hash(issued.token),
        token: expect.stringMatching(/^[\w-]{43}$/),
      });
    });

    it('should refuse a wrong secret', () => {
      expect(() => authenticate(client(), { secret: 'wrong' })).toThrow(ApiClientUnauthenticated);
    });

    it('should refuse a revoked client', () => {
      expect(() => authenticate(client({ revokedAt: now }))).toThrow(ApiClientUnauthenticated);
    });

    it('should refuse the right secret from another IP', () => {
      expect(() => authenticate(client(), { ip: '198.51.100.1' })).toThrow(new ApiClientForbidden('ip'));
    });

    it('should not tell a wrong secret from another IP that the identifier exists', () => {
      expect(() => authenticate(client(), { ip: '198.51.100.1', secret: 'wrong' })).toThrow(
        ApiClientUnauthenticated,
      );
    });
  });

  describe('authorize', () => {
    const authorize = (
      authorized: ApiClient,
      command: {
        ip?: string;
        scope?: ApiScope;
        tokenExpiresAt?: Date;
      } = {},
    ): void =>
      authorized.authorize({
        ip: '203.0.113.7',
        now,
        scope: 'magistrats:identification',
        tokenExpiresAt: new Date(now.getTime() + time.SECONDS),
        ...command,
      });

    it('should let a valid token through, from its IP and on its scope', () => {
      expect(() => authorize(client())).not.toThrow();
    });

    it('should recognise an allowed IPv4 given in its IPv6 form', () => {
      expect(() => authorize(client(), { ip: '::ffff:203.0.113.7' })).not.toThrow();
    });

    it('should recognise an allowed IPv6 however it is written', () => {
      const registered = client({ allowedIps: ['2001:DB8:0:0:0:0:0:1'] });

      expect(() => authorize(registered, { ip: '2001:db8::1' })).not.toThrow();
    });

    it('should refuse a token from the moment it expires', () => {
      expect(() => authorize(client(), { tokenExpiresAt: now })).toThrow(ApiClientUnauthenticated);
    });

    it('should refuse the token of a revoked client', () => {
      expect(() => authorize(client({ revokedAt: now }))).toThrow(ApiClientUnauthenticated);
    });

    it('should refuse another IP', () => {
      expect(() => authorize(client(), { ip: '198.51.100.1' })).toThrow(new ApiClientForbidden('ip'));
    });

    it('should refuse every IP to a client that has none allowed', () => {
      expect(() => authorize(client({ allowedIps: [] }))).toThrow(new ApiClientForbidden('ip'));
    });

    it('should refuse a scope the client was not given', () => {
      expect(() => authorize(client(), { scope: 'magistrats:status' })).toThrow(
        new ApiClientForbidden('scope'),
      );
    });

    it('should ask for a new token before telling an expired one that its IP is refused', () => {
      expect(() => authorize(client(), { ip: '198.51.100.1', tokenExpiresAt: now })).toThrow(
        ApiClientUnauthenticated,
      );
    });
  });
});
