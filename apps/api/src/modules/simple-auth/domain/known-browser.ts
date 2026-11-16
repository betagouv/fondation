import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';

import * as time from '../../../utils/time';

/**
 * A browser where a password login to an address succeeded within the year, which then has its own count of failures
 * (see LoginAttempt). Its cookie holds a random id and the date of that login, signed with the address: nothing is
 * stored, so nothing revokes it, and a stolen cookie only gives a quota of tries, not an access
 */
export class KnownBrowser {
  private static readonly LIFETIME_MS = time.YEARS;

  private constructor(
    readonly id: string,
    private readonly email: string,
    private readonly issuedAt: Date,
  ) {}

  get expiresAt(): Date {
    return new Date(this.issuedAt.getTime() + KnownBrowser.LIFETIME_MS);
  }

  /** at each successful login, which replaces the cookie of any other address */
  static issue(login: { email: string; now: Date }): KnownBrowser {
    return new KnownBrowser(randomUUID(), login.email.toLowerCase(), login.now);
  }

  /** null when the cookie is missing, altered, expired or issued for another address */
  static recognize(
    cookie: string | undefined,
    login: { email: string; now: Date },
    secret: string,
  ): KnownBrowser | null {
    const [id, issuedAt, signature] = cookie?.split('.') ?? [];
    if (!id || !issuedAt || !signature) return null;

    // The expiry rests on the signed date: the one of the cookie is up to the browser
    const browser = new KnownBrowser(id, login.email.toLowerCase(), new Date(Number(issuedAt)));
    const expected = Buffer.from(browser.signature(secret));
    const given = Buffer.from(signature);
    if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
    return browser.expiresAt > login.now ? browser : null;
  }

  cookie(secret: string): string {
    return `${this.id}.${this.issuedAt.getTime()}.${this.signature(secret)}`;
  }

  private signature(secret: string): string {
    return createHmac('sha256', secret)
      .update(`knownBrowser.${this.id}.${this.issuedAt.getTime()}.${this.email}`)
      .digest('base64url');
  }
}
