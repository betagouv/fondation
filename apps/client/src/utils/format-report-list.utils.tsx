import type { ReactNode } from 'react';

import { gradeToLabel } from '../components/reports/labels/labels-mappers';
import {
  reportListTableLabels,
  type ReportListTableLabels
} from '../components/reports/labels/report-list-table-labels';
import { DateOnly } from '../models/date-only.model';
import { getGdsReportPath } from './route-path.utils';

import type { DetailedMemberSessionDto } from '@api/types';
import type { GradeEnum, ReportStatusEnum } from '@/types/enums.types';

export type FormattedReport = {
  id: string;
  folderNumber: number | 'Profilé';
  state: ReportStatusEnum;
  dueDate: string | null;
  name: string;
  grade: string;
  targettedPosition: string;
  observers: ReactNode;
  href: string;
};

export type FormattedReportList = {
  newReportsCount: number;
  reports: FormattedReport[];
  headers: ReportListTableLabels['headers'];
};

function formatObserversList(observers: readonly string[]): ReactNode {
  switch (observers.length) {
    case 0:
      return '-';
    case 1:
      return observers[0];
    default:
      return (
        <ul className="list-none">
          {observers.map((o) => (
            <li key={`ReportListObservers_${o}`}>{o}</li>
          ))}
        </ul>
      );
  }
}

export const useFormattedReportList = (
  reports: DetailedMemberSessionDto['data']['reports']
): FormattedReportList => {
  const filteredReports = [...reports]
    .sort((a, b) =>
      Number.isFinite(a.folderNumber) && Number.isFinite(b.folderNumber)
        ? (a.folderNumber as number) - (b.folderNumber as number)
        : 0
    )
    .map(({ id, folderNumber, name, dueDate, state, grade, targettedPosition, observers }) => {
      const href = getGdsReportPath(id);
      const formattedObservers: ReactNode = formatObserversList(observers);
      const dueDateFormatted = dueDate
        ? new DateOnly(dueDate.year, dueDate.month, dueDate.day).toFormattedString()
        : null;

      return {
        id,
        folderNumber: folderNumber ?? 'Profilé',
        name,
        href,
        dueDate: dueDateFormatted,
        grade: gradeToLabel(grade as GradeEnum),
        targettedPosition,
        observers: formattedObservers,
        state: state as ReportStatusEnum
      } as const;
    });

  return {
    reports: filteredReports,
    newReportsCount: filteredReports.filter(({ state }) => state === 'NEW').length,
    headers: reportListTableLabels.headers
  };
};
