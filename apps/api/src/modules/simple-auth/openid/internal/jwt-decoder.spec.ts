import { generateKeyPairSync, type KeyObject, sign as signData } from 'node:crypto';

import z from 'zod';

import {
  JwtDecoder,
  JwtExpired,
  JwtInvalidNonce,
  JwtInvalidSignature,
  JwtUnexpectedAudience,
  JwtUnknownKey,
} from './jwt-decoder';
import type { OpenIdConfig } from './openid-config';
import type { OpenIdAuthenticationRequest } from './openid-request';
import type { Jwk } from './openid.schema';

const ISSUER = 'https://issuer.test';
const AUDIENCE = 'client-id';
const NOW = new Date('2026-06-18T00:00:00.000Z');

function signJwt(privateKey: KeyObject, kid: string, payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', kid })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = signData('sha256', Buffer.from(`${header}.${body}`), privateKey).toString('base64url');

  return `${header}.${body}.${signature}`;
}

describe('JwtDecoder', () => {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const jwk: Jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'key-1', alg: 'RS256' } as Jwk;
  const verifier = new JwtDecoder(
    { clientId: AUDIENCE, keys: [jwk], issuer: ISSUER } as unknown as OpenIdConfig,
    { state: { nonce: Buffer.from('nonce-abc') } } as unknown as OpenIdAuthenticationRequest,
  );

  const validPayload = {
    iss: ISSUER,
    aud: AUDIENCE,
    sub: 'user-123',
    nonce: Buffer.from('nonce-abc').toString('base64url'),
    exp: Math.floor(NOW.getTime() / 1000) + 60,
  };

  it('returns the payload of a valid token', () => {
    const token = signJwt(privateKey, 'key-1', validPayload);

    expect(verifier.decode({ token, now: NOW })).toMatchObject({ sub: 'user-123' });
  });

  it('rejects a token whose signature was tampered with', () => {
    const token = signJwt(privateKey, 'key-1', validPayload);
    const tampered = `${token.slice(0, -4)}aaaa`;

    expect(() => verifier.decode({ token: tampered, now: NOW })).toThrow(JwtInvalidSignature);
  });

  it('rejects an invalid token signature', () => {
    const other = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const token = signJwt(other.privateKey, 'key-1', validPayload);

    expect(() => verifier.decode({ token, now: NOW })).toThrow(JwtInvalidSignature);
  });

  it('rejects an unknown key', () => {
    const token = signJwt(privateKey, 'unknown-key', validPayload);
    expect(() => verifier.decode({ token, now: NOW })).toThrow(JwtUnknownKey);
  });

  it('rejects an expired token', () => {
    const token = signJwt(privateKey, 'key-1', {
      ...validPayload,
      exp: Math.floor(NOW.getTime() / 1000) - 1,
    });

    expect(() => verifier.decode({ token, now: NOW })).toThrow(JwtExpired);
  });

  it('accepts a token without audience nor nonce, as a userinfo', () => {
    const { aud: _aud, nonce: _nonce, ...userInfo } = validPayload;
    const token = signJwt(privateKey, 'key-1', userInfo);

    expect(verifier.decode({ token, now: NOW })).toMatchObject({ sub: 'user-123' });
  });

  describe('decodeIdToken', () => {
    it('returns the payload of a valid id token', () => {
      const token = signJwt(privateKey, 'key-1', validPayload);

      expect(verifier.decodeIdToken({ token, now: NOW })).toMatchObject({ sub: 'user-123' });
    });

    it('rejects an id token without nonce', () => {
      const { nonce: _nonce, ...payload } = validPayload;
      const token = signJwt(privateKey, 'key-1', payload);

      expect(() => verifier.decodeIdToken({ token, now: NOW })).toThrow(JwtInvalidNonce);
    });

    it('rejects a nonce mismatch', () => {
      const token = signJwt(privateKey, 'key-1', {
        ...validPayload,
        nonce: Buffer.from('other-nonce').toString('base64url'),
      });

      expect(() => verifier.decodeIdToken({ token, now: NOW })).toThrow(JwtInvalidNonce);
    });

    it('rejects an id token without audience', () => {
      const { aud: _aud, ...payload } = validPayload;
      const token = signJwt(privateKey, 'key-1', payload);

      expect(() => verifier.decodeIdToken({ token, now: NOW })).toThrow(JwtUnexpectedAudience);
    });

    it('rejects an id token issued for another client', () => {
      const token = signJwt(privateKey, 'key-1', { ...validPayload, aud: 'other-client' });

      expect(() => verifier.decodeIdToken({ token, now: NOW })).toThrow(JwtUnexpectedAudience);
    });

    it('accepts several audiences when the authorized party is the client', () => {
      const token = signJwt(privateKey, 'key-1', {
        ...validPayload,
        aud: [AUDIENCE, 'other-client'],
        azp: AUDIENCE,
      });

      expect(verifier.decodeIdToken({ token, now: NOW })).toMatchObject({ sub: 'user-123' });
    });

    it('rejects several audiences when the authorized party is another client', () => {
      const token = signJwt(privateKey, 'key-1', {
        ...validPayload,
        aud: [AUDIENCE, 'other-client'],
        azp: 'other-client',
      });

      expect(() => verifier.decodeIdToken({ token, now: NOW })).toThrow(JwtUnexpectedAudience);
    });

    it('rejects a single audience when the authorized party is another client', () => {
      const token = signJwt(privateKey, 'key-1', { ...validPayload, azp: 'other-client' });

      expect(() => verifier.decodeIdToken({ token, now: NOW })).toThrow(JwtUnexpectedAudience);
    });
  });

  it('should validate the payload', () => {
    const token = signJwt(privateKey, 'key-1', {
      ...validPayload,
      email: 'email@domain.tld',
    });

    const decoded = verifier.decode({ token, now: NOW, schema: z.object({ email: z.email() }) });
    expect(decoded.email).toBeDefined();

    const invalidToken = signJwt(privateKey, 'key-1', {
      ...validPayload,
      email: 42,
    });

    expect(() =>
      verifier.decode({
        token: invalidToken,
        now: NOW,
        schema: z.object({ email: z.email() }),
      }),
    ).toThrow(z.ZodError);
  });
});
