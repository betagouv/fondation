import * as time from '../../../utils/time';

import {
  ApiClient,
  ApiClientForbidden,
  ApiClientNotRotatable,
  ApiClientUnauthenticated,
  ApiScope,
  canonicalIp,
  InvalidAllowedIp,
  IssuedAccessToken,
} from './api-client';

describe('ApiClient', () => {
  const now = new Date('2026-11-18T10:00:00Z');
  const { hash: secretHash, secret } = ApiClient.generateSecret();

  const client = (
    props: {
      allowedIps?: string[];
      previousSecret?: { expiresAt: Date; hash: string };
      revokedAt?: Date;
      secretHash?: string;
    } = {},
  ) =>
    new ApiClient({
      allowedIps: ['203.0.113.7'],
      authLimitPerMinute: 10,
      id: 'client-1',
      previousSecret: null,
      revokedAt: null,
      scopes: [{ limitPerMinute: 20, scope: 'magistrats:identification' }],
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
        issuedAt: now,
        secretHash,
        token: expect.stringMatching(/^[\w-]{43}$/),
      });
    });

    it('should tell the replaced secret a token was given for while a rotation lasts', () => {
      const replaced = ApiClient.generateSecret();
      const rotating = client({
        previousSecret: { expiresAt: new Date('2026-11-25T10:00:00Z'), hash: replaced.hash },
      });

      expect(authenticate(rotating, { secret: replaced.secret }).secretHash).toBe(replaced.hash);
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

  describe('rotateSecret', () => {
    // seven days later, unless told otherwise
    const previousValidUntil = new Date('2026-11-25T10:00:00Z');
    const rotatedClient = () => {
      const { secret: newSecret, ...secrets } = client().rotateSecret({ now });

      return { client: client(secrets), newSecret };
    };

    it('should accept the new secret and the one it replaces while the partner switches', () => {
      const { client: rotatedOne, newSecret } = rotatedClient();

      expect(() => rotatedOne.authenticate({ ip: '203.0.113.7', now, secret: newSecret })).not.toThrow();
      expect(() => rotatedOne.authenticate({ ip: '203.0.113.7', now, secret })).not.toThrow();
    });

    it('should refuse the replaced secret from the end of the switch, the new one staying valid', () => {
      const { client: rotatedOne, newSecret } = rotatedClient();
      const afterwards = { ip: '203.0.113.7', now: previousValidUntil };

      expect(() => rotatedOne.authenticate({ ...afterwards, secret })).toThrow(ApiClientUnauthenticated);
      expect(() => rotatedOne.authenticate({ ...afterwards, secret: newSecret })).not.toThrow();
    });

    it('should not rotate the secret of a revoked client', () => {
      expect(() => client({ revokedAt: now }).rotateSecret({ now })).toThrow(
        new ApiClientNotRotatable('revoked'),
      );
    });

    it('should not rotate again while the replaced secret is still valid, which would cut off its holder', () => {
      const { client: rotatedOne } = rotatedClient();

      expect(() => rotatedOne.rotateSecret({ now })).toThrow(new ApiClientNotRotatable('rotating'));
    });

    it('should rotate again once the replaced secret is no longer valid', () => {
      const { client: rotatedOne } = rotatedClient();

      expect(() => rotatedOne.rotateSecret({ now: previousValidUntil })).not.toThrow();
    });

    it('should not keep the replaced secret valid more than thirty days', () => {
      expect(() => client().rotateSecret({ days: 31, now })).toThrow(new ApiClientNotRotatable('days'));
    });
  });

  describe('status', () => {
    const replaced = { expiresAt: new Date('2026-11-25T10:00:00Z'), hash: 'replaced' };

    it('should be rotating until the replaced secret stops being accepted', () => {
      expect(client({ previousSecret: replaced }).status(now)).toEqual({
        until: replaced.expiresAt,
        value: 'ROTATING',
      });
    });

    it('should be active again once the replaced secret is no longer accepted', () => {
      expect(client({ previousSecret: replaced }).status(replaced.expiresAt)).toEqual({ value: 'ACTIVE' });
    });

    it('should stay revoked whatever rotation was running', () => {
      expect(client({ previousSecret: replaced, revokedAt: now }).status(now)).toEqual({
        since: now,
        value: 'REVOKED',
      });
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
    ): { limitPerMinute: number } =>
      authorized.authorize({
        ip: '203.0.113.7',
        now,
        scope: 'magistrats:identification',
        tokenExpiresAt: new Date(now.getTime() + time.SECONDS),
        ...command,
      });

    it('should let a valid token through, from its IP and on its scope, and tell the limit of this scope', () => {
      expect(authorize(client())).toEqual({ limitPerMinute: 20 });
    });

    it('should recognise an allowed IPv4 given in its IPv6 form', () => {
      expect(authorize(client(), { ip: '::ffff:203.0.113.7' })).toEqual({ limitPerMinute: 20 });
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

  describe('allowedIps', () => {
    it('should name the line that is no address', () => {
      expect(() => ApiClient.allowedIps(['203.0.113.7', '203.0.113'])).toThrow(
        new InvalidAllowedIp('203.0.113'),
      );
    });

    it('should keep an IP given twice once', () => {
      expect(ApiClient.allowedIps(['203.0.113.7', '2001:db8::1', '203.0.113.7'])).toEqual([
        '203.0.113.7',
        '2001:db8::1',
      ]);
    });
  });

  describe('canonicalIp', () => {
    it.each(['203.0.113.7', '::ffff:203.0.113.7', '::FFFF:203.0.113.7', '::ffff:cb00:7107'])(
      'should give an IPv4 written as %s in its IPv4 form',
      (ip) => {
        expect(canonicalIp(ip)).toBe('203.0.113.7');
      },
    );

    it('should give an IPv6 however it is written in its shortest form', () => {
      expect(canonicalIp('2001:DB8:0:0:0:0:0:1')).toBe('2001:db8::1');
    });

    it('should give nothing for what is not an IP', () => {
      expect(canonicalIp('unknown')).toBeUndefined();
    });
  });
});
