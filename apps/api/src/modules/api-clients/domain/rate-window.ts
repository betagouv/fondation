import * as time from '../../../utils/time';

export class ApiClientRateLimited extends Error {
  constructor(
    /** seconds before the caller may try again */
    readonly retryAfter: number,
  ) {
    super(`API client rate limited for ${retryAfter} s`);
  }
}

/**
 * The fixed window of one minute in which the calls of a caller on a route are counted.
 *
 * Fixed and not sliding: one row and one statement per call. A caller may then spend two limits around a boundary,
 * which the limits of the contract leave room for.
 */
export class RateWindow {
  private static readonly SIZE_MS = time.MINUTES;

  /** The minute the calls are counted under */
  readonly start: Date;

  constructor(readonly now: Date) {
    this.start = new Date(Math.floor(now.getTime() / RateWindow.SIZE_MS) * RateWindow.SIZE_MS);
  }

  /** @param count the calls of the window, this one included */
  assertWithin(limit: number, count: number): void {
    if (count > limit) throw new ApiClientRateLimited(this.retryAfter);
  }

  /**
   * The first call refused in the window: the ones after it count too, hence once a minute at most
   * @param count the calls of the window, this one included
   */
  isFirstOver(limit: number, count: number): boolean {
    return count === limit + 1;
  }

  /**
   * The last call let through in the window: the next one is refused, hence once a minute at most
   * @param count the calls of the window, this one included
   */
  isLastWithin(limit: number, count: number): boolean {
    return count === limit;
  }

  /** Never 0: a caller told to retry at once would be refused again */
  private get retryAfter(): number {
    return Math.ceil((this.start.getTime() + RateWindow.SIZE_MS - this.now.getTime()) / time.SECONDS);
  }
}
