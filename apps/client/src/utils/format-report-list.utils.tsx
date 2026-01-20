import { gradeToLabel } from '../components/reports/labels/labels-mappers';
import {
  reportListTableLabels,
  type ReportListTableLabels
} from '../components/reports/labels/report-list-table-labels';
import { DateOnly } from '../models/date-only.model';
import { getGdsReportPath } from './route-path.utils';

import type { DetailedMemberSessionDto } from '@api/types';
import { PrioriteEnumLabels, type GradeEnum, type ReportStatusEnum } from '@/types/enums.types';
import type { ObservationLinkItem } from '@/components/shared/ObservationLinks';

export type FormattedReport = {
  id: string;
  nominationFileId: string;
  folderNumber: number | 'Profilé';
  state: ReportStatusEnum;
  dueDate: string | null;
  name: string;
  grade: string;
  targettedPosition: string;
  lodamObservants: string[];
  priority: string;
  observationMagistrats: ObservationLinkItem[];
  href: string;
};

export type FormattedReportList = {
  newReportsCount: number;
  reports: FormattedReport[];
  headers: ReportListTableLabels['headers'];
};

export const useFormattedReportList = (
  reports: DetailedMemberSessionDto['data']['reports']
): FormattedReportList => {
  const filteredReports = reports
    .toSorted((a, b) =>
      Number.isFinite(a.folderNumber) && Number.isFinite(b.folderNumber)
        ? (a.folderNumber as number) - (b.folderNumber as number)
        : 0
    )
    .map(
      ({
        id,
        nominationFileId,
        folderNumber,
        name,
        dueDate,
        state,
        grade,
        targettedPosition,
        observers,
        observationMagistrats,
        filePriority
      }) => {
        const href = getGdsReportPath(id);
        const dueDateFormatted = dueDate
          ? new DateOnly(dueDate.year, dueDate.month, dueDate.day).toFormattedString()
          : null;

        return {
          id,
          nominationFileId,
          folderNumber: folderNumber ?? ('Profilé' as const),
          name,
          href,
          dueDate: dueDateFormatted,
          grade: gradeToLabel(grade as GradeEnum),
          targettedPosition,
          priority: filePriority ? PrioriteEnumLabels[filePriority] : '-',
          lodamObservants: observers,
          observationMagistrats,
          state: state as ReportStatusEnum
        };
      }
    );

  return {
    reports: filteredReports,
    newReportsCount: filteredReports.filter(({ state }) => state === 'NEW').length,
    headers: reportListTableLabels.headers
  };
};
