import type { DetailedReportDto } from '@api/types';

export function formatObservers(observers: DetailedReportDto['observers']): string[] | null {
  if (!observers || observers.length === 0) {
    return null;
  }

  return observers?.flatMap((observer) => observer.split('\n'));
}
