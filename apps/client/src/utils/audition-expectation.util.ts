import type { PlainDateOnly } from '@/utils/date-only.util';

type AuditionedPosition = {
  auditionDate: PlainDateOnly | null;
  auditionExpected: boolean;
  isArchived: boolean;
};

type ReportedPosition = {
  expectedReportersCount: number | null;
  isArchived: boolean;
};

export function isAuditionMissing(position: AuditionedPosition): boolean {
  return position.auditionExpected && !position.isArchived && !position.auditionDate;
}

export function areReportersMissing(position: ReportedPosition, reportersCount: number): boolean {
  if (position.isArchived || position.expectedReportersCount === null) return false;

  return reportersCount < position.expectedReportersCount;
}
