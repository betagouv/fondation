import * as time from '../../../utils/time';

const LOGIN_THROTTLES = ['email', 'ip', 'knownBrowser'] as const;
export type LoginThrottle = (typeof LOGIN_THROTTLES)[number];

/**
 * A password login, counted per address typed, whether it has an account or not, and per IP.
 *
 * Counted per address alone, ten requests every fifteen minutes would let anyone suspend a member's logins.
 * A known browser (an OWASP device cookie) therefore escapes the suspension of its address and has its own count:
 * its failures do not count for the address. The IP limit applies to every attempt.
 */
export class LoginAttempt {
  private static readonly LIMITS: Record<LoginThrottle, number> = { email: 10, ip: 100, knownBrowser: 10 };
  private static readonly WINDOW_MS = 15 * time.MINUTES;

  readonly email: string;
  readonly id: string;
  readonly ip: string;
  readonly knownBrowser: string | null;

  constructor(
    attempt: { email: string; id: string; ip: string; knownBrowser: string | null },
    /** the failures within the window, before this attempt */
    private readonly failures: Record<LoginThrottle, number>,
  ) {
    this.email = attempt.email;
    this.id = attempt.id;
    this.ip = attempt.ip;
    this.knownBrowser = attempt.knownBrowser;
  }

  static windowStart(now: Date): Date {
    return new Date(now.getTime() - LoginAttempt.WINDOW_MS);
  }

  /** a suspended attempt is not counted, so that the suspension ends once the window slides */
  get isSuspended(): boolean {
    return this.counts.some(({ throttle }) => this.failures[throttle] >= LoginAttempt.LIMITS[throttle]);
  }

  /** the thresholds that the failure of this attempt reaches, which the next attempt would exceed */
  get crossedThresholds(): { limit: number; target: string; throttle: LoginThrottle }[] {
    return this.counts
      .filter(({ throttle }) => this.failures[throttle] + 1 === LoginAttempt.LIMITS[throttle])
      .map((count) => ({ ...count, limit: LoginAttempt.LIMITS[count.throttle] }));
  }

  /**
   * The count that could suspend this browser on this address, whose failures a success forgets.
   * Not those of the address when the browser is known: each login of the member would give ten more tries to whoever
   * tries their address
   */
  get forgottenOnSuccess(): { target: string; throttle: Exclude<LoginThrottle, 'ip'> } {
    return this.knownBrowser
      ? { target: this.knownBrowser, throttle: 'knownBrowser' }
      : { target: this.email.toLowerCase(), throttle: 'email' };
  }

  /** the counts that apply to this attempt, each with what it counts by */
  private get counts(): { target: string; throttle: LoginThrottle }[] {
    return [this.forgottenOnSuccess, { target: this.ip, throttle: 'ip' }];
  }
}
