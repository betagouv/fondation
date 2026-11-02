import * as time from '../../../utils/time';

const LOGIN_THROTTLES = ['email', 'ip'] as const;
export type LoginThrottle = (typeof LOGIN_THROTTLES)[number];

/** A password login, counted per address typed, whether it has an account or not, and per IP */
export class LoginAttempt {
  private static readonly LIMITS: Record<LoginThrottle, number> = { email: 10, ip: 100 };
  private static readonly WINDOW_MS = 15 * time.MINUTES;

  readonly email: string;
  readonly id: string;
  readonly ip: string;

  constructor(
    attempt: { email: string; id: string; ip: string },
    /** the failures within the window, before this attempt */
    private readonly failures: Record<LoginThrottle, number>,
  ) {
    this.email = attempt.email;
    this.id = attempt.id;
    this.ip = attempt.ip;
  }

  static windowStart(now: Date): Date {
    return new Date(now.getTime() - LoginAttempt.WINDOW_MS);
  }

  /** a suspended attempt is not counted, so that the suspension ends once the window slides */
  get isSuspended(): boolean {
    return LOGIN_THROTTLES.some((throttle) => this.failures[throttle] >= LoginAttempt.LIMITS[throttle]);
  }

  /** the thresholds that the failure of this attempt reaches, which the next attempt would exceed */
  get crossedThresholds(): { limit: number; throttle: LoginThrottle }[] {
    return LOGIN_THROTTLES.filter(
      (throttle) => this.failures[throttle] + 1 === LoginAttempt.LIMITS[throttle],
    ).map((throttle) => ({ limit: LoginAttempt.LIMITS[throttle], throttle }));
  }
}
