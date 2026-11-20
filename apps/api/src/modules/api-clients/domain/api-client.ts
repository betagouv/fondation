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

/** How many days the replaced secret stays valid: unless told otherwise, and at most */
export const ROTATION_DAYS = { default: 7, max: 30 } as const;

const NOT_ROTATABLE = {
  days: `the replaced secret stays valid between 1 and ${ROTATION_DAYS.max} days`,
  revoked: 'the API client is revoked',
  rotating:
    'a rotation is still running, and replacing the secret again would cut off a partner still on the replaced one: end the rotation first',
} as const;

export class ApiClientNotRotatable extends Error {
  constructor(readonly reason: keyof typeof NOT_ROTATABLE) {
    super(`The secret cannot be replaced: ${NOT_ROTATABLE[reason]}`);
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
      /** The secret replaced by the last rotation, still accepted until the partner has switched */
      previousSecret: { expiresAt: Date; hash: string } | null;
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

  private static sameHash(given: string, expected: string): boolean {
    return given.length === expected.length && timingSafeEqual(Buffer.from(given), Buffer.from(expected));
  }

  /** Exchanges the secret for a token: the secret is checked before the IP, so that an IP never learns which identifiers exist */
  authenticate(command: { ip: string; now: Date; secret: string }): IssuedAccessToken {
    const { previousSecret, secretHash } = this.props;
    const given = ApiClient.hash(command.secret);
    const accepted = this.isRotating(command.now) ? [secretHash, previousSecret!.hash] : [secretHash];
    const isKnown = accepted.some((hash) => ApiClient.sameHash(given, hash));
    if (this.props.revokedAt || !isKnown) throw new ApiClientUnauthenticated();
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
   * Replaces the secret, the one it replaces staying valid for some days, until the partner has switched: the website
   * is never cut off.
   *
   * Not while a rotation lasts: the replaced secret may be the only one the partner holds yet, and replacing again
   * would refuse it at once
   */
  rotateSecret(command: { days?: number; now: Date }): {
    previousSecret: { expiresAt: Date; hash: string };
    secret: string;
    secretHash: string;
  } {
    const days = command.days ?? ROTATION_DAYS.default;
    if (this.props.revokedAt) throw new ApiClientNotRotatable('revoked');
    if (this.isRotating(command.now)) throw new ApiClientNotRotatable('rotating');
    if (days < 1 || days > ROTATION_DAYS.max) throw new ApiClientNotRotatable('days');
    const { hash: secretHash, secret } = ApiClient.generateSecret();

    return {
      previousSecret: {
        expiresAt: new Date(command.now.getTime() + days * time.DAYS),
        hash: this.props.secretHash,
      },
      secret,
      secretHash,
    };
  }

  private isRotating(now: Date): boolean {
    const { previousSecret } = this.props;

    return previousSecret !== null && now < previousSecret.expiresAt;
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
