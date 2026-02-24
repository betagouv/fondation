import { DateOnly } from '@/models/date-only.model';
import type { DetailedReportDto } from '@api/types';
import type { DateOnlyJson } from 'shared-models';

export function formatDurationFromDate(startDate: Date, endDate: Date = new Date()): string {
  const startYear = startDate.getFullYear();
  const startMonth = startDate.getMonth();
  const endYear = endDate.getFullYear();
  const endMonth = endDate.getMonth();

  const months = (endYear - startYear) * 12 + (endMonth - startMonth);
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (years === 0) {
    return `${remainingMonths} mois`;
  }

  if (remainingMonths === 0) {
    return `${years} an${years > 1 ? 's' : ''}`;
  }

  return `${years} an${years > 1 ? 's' : ''} et ${remainingMonths} mois`;
}

export function formatBirthDate(birthDateJson: DateOnlyJson, currentDate: Date): string {
  const birthDate = DateOnly.fromStoreModel(birthDateJson);
  const today = DateOnly.fromDate(currentDate);
  const age = birthDate.getAge(today);
  return `${birthDate.toFormattedString()} (${age} ans)`;
}

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
