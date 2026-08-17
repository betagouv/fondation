import type { PlainDateOnly } from '@/utils/date-only.util';

type AuditionedPosition = {
  auditionDate: PlainDateOnly | null;
  auditionExpected: boolean;
  canScheduleAudition: boolean;
};

type ReportedPosition = {
  canAffectReporters: boolean;
  expectedReportersCount: number | null;
};

export function isAuditionMissing(position: AuditionedPosition): boolean {
  return position.auditionExpected && position.canScheduleAudition && !position.auditionDate;
}

export function areReportersMissing(position: ReportedPosition, reportersCount: number): boolean {
  if (!position.canAffectReporters || position.expectedReportersCount === null) return false;

  return reportersCount < position.expectedReportersCount;
}
