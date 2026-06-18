import type { DetailedReportDto } from '@api/types';

export function formatObservers(observers: DetailedReportDto['observers']): string[] | null {
  if (!observers || observers.length === 0) {
    return null;
  }

  return observers?.flatMap((observer) => observer.split('\n'));
}

export function formatBiography(biography: string | null): string | null {
  if (!biography) return null;
  if (biography.indexOf('- ') === -1) return biography;

  return biography
    .split('- ')
    .map((part) => part.trim())
    .filter((x) => !!x)
    .map((part) => `- ${part}`)
    .join('\n');
}
