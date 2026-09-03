import * as time from 'src/utils/time';

const EXPIRATION_DELAY = 2 * time.HOURS;

export function isExpired(job: { startedAt: Date | null }, now: Date): boolean {
  if (!job.startedAt) return true;

  return now.getTime() - job.startedAt.getTime() >= EXPIRATION_DELAY;
}
