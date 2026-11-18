import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { BlockList, isIP, isIPv6 } from 'node:net';

import * as time from '../../../utils/time';

export const API_SCOPES = ['magistrats:identification', 'magistrats:status'] as const;
export type ApiScope = (typeof API_SCOPES)[number];

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

  readonly id: string;

  constructor(
    private readonly props: {
      allowedIps: readonly string[];
      id: string;
      revokedAt: Date | null;
      scopes: readonly string[];
      secretHash: string;
    },
  ) {
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

  /** What a new token would fix comes first (401), what only Fondation can fix comes next (403) */
  authorize(command: { ip: string; now: Date; scope: ApiScope; tokenExpiresAt: Date }): void {
    if (this.props.revokedAt || command.tokenExpiresAt <= command.now) throw new ApiClientUnauthenticated();
    this.assertAllowedIp(command.ip);
    if (!this.props.scopes.includes(command.scope)) throw new ApiClientForbidden('scope');
  }

  /** A client without any allowed IP is refused from everywhere */
  private assertAllowedIp(ip: string): void {
    // Addresses and not their texts are compared: an IPv6 is written in several ways, and Node gives an IPv4 received
    // on a dual-stack socket as ::ffff:203.0.113.7
    const allowed = new BlockList();
    for (const allowedIp of this.props.allowedIps) allowed.addAddress(allowedIp, ApiClient.family(allowedIp));

    if (!isIP(ip) || !allowed.check(ip, ApiClient.family(ip))) throw new ApiClientForbidden('ip');
  }

  private static family(ip: string): 'ipv4' | 'ipv6' {
    return isIPv6(ip) ? 'ipv6' : 'ipv4';
  }
}
