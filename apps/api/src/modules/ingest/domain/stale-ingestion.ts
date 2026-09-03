import * as time from 'src/utils/time';

const STALENESS_DELAY = 4 * time.DAYS;

export function isStale(lastSuccessAt: Date | null, now: Date): boolean {
  if (!lastSuccessAt) return true;

  return now.getTime() - lastSuccessAt.getTime() >= STALENESS_DELAY;
}
