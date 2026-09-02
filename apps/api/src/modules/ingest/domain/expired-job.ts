const EXPIRATION_DELAY = 2 * 60 * 60 * 1_000;

export function isExpired(job: { startedAt: Date | null }, now: Date): boolean {
  if (!job.startedAt) return true;

  return now.getTime() - job.startedAt.getTime() >= EXPIRATION_DELAY;
}
