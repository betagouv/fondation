import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { isIP, isIPv4, isIPv6, SocketAddress } from 'node:net';

import * as time from '../../../utils/time';

export const API_SCOPES = ['magistrats:identification', 'magistrats:status'] as const;
export type ApiScope = (typeof API_SCOPES)[number];

/** What a new client gets */
export const DEFAULT_LIMITS_PER_MINUTE = {
  auth: 10,
  'magistrats:identification': 20,
  'magistrats:status': 300,
} as const satisfies Record<ApiScope | 'auth', number>;

/**
 * How many calls of an IP may be refused (401, 403) in a minute, all routes together, before it is turned away
 * unchecked. Not for an IP a client is allowed: a partner gets 401s in normal times, when its token expires or a
 * rotation ends, and its tokens, 32 random bytes, cannot be guessed
 */
export const REFUSALS_LIMIT_PER_MINUTE = 10;

/** Unknown or revoked client, wrong secret, unknown or expired token: the answer never tells which */
export class ApiClientUnauthenticated extends Error {}

/** A known client asking from elsewhere, or for something else, than what it was registered for */
export class ApiClientForbidden extends Error {
  constructor(readonly reason: 'ip' | 'scope') {
    super(`API client refused on its ${reason}`);
  }
}

export type IssuedAccessToken = { expiresAt: Date; expiresIn: number; hash: string; token: string };

/**
 * A partner system that calls the public API with a short-lived token, obtained from its identifier and its secret.
 *
 * Secret and token are 32 random bytes: a plain SHA-256 is enough to store them, a slow hash would only protect a
 * value someone chose.
 */
export class ApiClient {
  static readonly TOKEN_LIFETIME_MS = 15 * time.MINUTES;

  readonly authLimitPerMinute: number;
  readonly id: string;

  constructor(
    private readonly props: {
      allowedIps: readonly string[];
      authLimitPerMinute: number;
      id: string;
      revokedAt: Date | null;
      scopes: readonly { limitPerMinute: number; scope: string }[];
      secretHash: string;
    },
  ) {
    this.authLimitPerMinute = props.authLimitPerMinute;
    this.id = props.id;
  }

  static generateSecret(): { hash: string; secret: string } {
    const secret = randomBytes(32).toString('base64url');

    return { hash: ApiClient.hash(secret), secret };
  }

  static hash(secretOrToken: string): string {
    return createHash('sha256').update(secretOrToken).digest('hex');
  }

  /** Exchanges the secret for a token: the secret is checked before the IP, so that an IP never learns which identifiers exist */
  authenticate(command: { ip: string; now: Date; secret: string }): IssuedAccessToken {
    const given = Buffer.from(ApiClient.hash(command.secret));
    const expected = Buffer.from(this.props.secretHash);
    if (this.props.revokedAt || given.length !== expected.length || !timingSafeEqual(given, expected)) {
      throw new ApiClientUnauthenticated();
    }
    this.assertAllowedIp(command.ip);

    const token = randomBytes(32).toString('base64url');

    return {
      expiresAt: new Date(command.now.getTime() + ApiClient.TOKEN_LIFETIME_MS),
      expiresIn: ApiClient.TOKEN_LIFETIME_MS / time.SECONDS,
      hash: ApiClient.hash(token),
      token,
    };
  }

  /**
   * What a new token would fix comes first (401), what only Fondation can fix comes next (403)
   *
   * @returns how many calls a minute the client may make on this scope
   */
  authorize(command: { ip: string; now: Date; scope: ApiScope; tokenExpiresAt: Date }): {
    limitPerMinute: number;
  } {
    if (this.props.revokedAt || command.tokenExpiresAt <= command.now) throw new ApiClientUnauthenticated();
    this.assertAllowedIp(command.ip);
    const granted = this.props.scopes.find(({ scope }) => scope === command.scope);
    if (!granted) throw new ApiClientForbidden('scope');

    return { limitPerMinute: granted.limitPerMinute };
  }

  /** A client without any allowed IP is refused from everywhere */
  private assertAllowedIp(ip: string): void {
    if (!isAllowedIp(ip, this.props.allowedIps)) throw new ApiClientForbidden('ip');
  }
}

/** Compares addresses, not their texts */
export function isAllowedIp(ip: string, allowedIps: readonly string[]): boolean {
  const caller = canonicalIp(ip);

  return caller !== undefined && allowedIps.some((allowedIp) => canonicalIp(allowedIp) === caller);
}

/**
 * One text per address, or undefined when it is none: an IPv6 is written in several ways, and Node gives an IPv4
 * received on a dual-stack socket as ::ffff:203.0.113.7
 */
export function canonicalIp(ip: string): string | undefined {
  if (!isIP(ip)) return undefined;
  const { address } = new SocketAddress({ address: ip, family: isIPv6(ip) ? 'ipv6' : 'ipv4' });
  const mapped = address.startsWith('::ffff:') ? address.slice('::ffff:'.length) : undefined;

  return mapped && isIPv4(mapped) ? mapped : address;
}
