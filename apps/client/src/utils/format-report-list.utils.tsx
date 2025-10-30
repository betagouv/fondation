import { gradeToLabel } from '../components/reports/labels/labels-mappers';
import {
  reportListTableLabels,
  type ReportListTableLabels
} from '../components/reports/labels/report-list-table-labels';
import { stateToLabel } from '../components/reports/labels/state-label.mapper';
import { DateOnly } from '../models/date-only.model';
import type { DetailedSessionReport } from '../react-query/queries/members/sessions.queries';
import { getGdsReportPath } from './route-path.utils';

export type ReportListItemVM = {
  id: string;
  folderNumber: number | 'Profilé';
  state: ReturnType<typeof stateToLabel>;
  dueDate: string | null;
  name: string;
  grade: ReturnType<typeof gradeToLabel>;
  targettedPosition: string;
  observersCount: number;
  href: string;
  onClick: (event: React.MouseEvent<HTMLAnchorElement>) => void;
};

export type ReportListVM = {
  newReportsCount: number;
  reports: ReportListItemVM[];
  headers: ReportListTableLabels['headers'];
};

export const formatReportList = (reports: DetailedSessionReport[]): ReportListVM => {
  const sortedReports = [...(reports || [])].sort((a, b) => {
    if (b === null) return -1;
    if (a === null) return 1;
    if (a.folderNumber && b.folderNumber) {
      if (a.folderNumber < b.folderNumber) return -1;
      if (a.folderNumber > b.folderNumber) return 1;
    }
    return 0;
  });

  const filteredReports = sortedReports.map(
    ({ id, folderNumber, name, dueDate, state, grade, targettedPosition, observersCount }) => {
      const href = getGdsReportPath(id);

      const dueDateFormatted = dueDate
        ? new DateOnly(dueDate.year, dueDate.month, dueDate.day).toFormattedString()
        : null;

      return {
        id,
        folderNumber: folderNumber ?? 'Profilé',
        state: stateToLabel(state),
        dueDate: dueDateFormatted,
        name,
        grade: gradeToLabel(grade),
        targettedPosition,
        observersCount,
        href,
        onClick: (event: React.MouseEvent<HTMLAnchorElement>) => {
          event.preventDefault();
          window.location.href = href;
        }
      } as const;
    }
  );

  return {
    newReportsCount: filteredReports.reduce(
      (count, report) => (report.state === 'Nouveau' ? count + 1 : count),
      0
    ),
    headers: reportListTableLabels.headers,
    reports: filteredReports
  };
};
