import { Table } from '@codegouvfr/react-dsfr/Table';
import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import type { NominationFile } from 'shared-models';

import type { DetailedSessionReport } from '../../../../react-query/queries/members/sessions.queries';
import type { ReportFiltersState, ReportListPaginationProps } from './ReportList';
import { reportListTableLabels } from '../../labels/report-list-table-labels';
import { gradeToLabel } from '../../labels/labels-mappers';
import { getGdsReportPath } from '../../../../utils/route-path.utils';
import { DateOnly } from '../../../../models/date-only.model';
import './ReportsTable.css';
import { ReportStateTag } from './ReportStateTag';
import { SortButton } from '../../../shared/SortButton';
import { TableControl } from '../../../shared/TableControl';
import { FiltresRapports } from './FiltresRapports';

type SortableField = 'folderNumber' | 'name' | 'grade' | 'targettedPosition' | 'state';

const HEADERS: { key: SortableField | 'observers' | 'dueDate'; label: string; sortable: boolean }[] = [
  { key: 'folderNumber', label: reportListTableLabels.headers.folderNumber, sortable: true },
  { key: 'name', label: reportListTableLabels.headers.name, sortable: true },
  { key: 'grade', label: reportListTableLabels.headers.grade, sortable: true },
  { key: 'targettedPosition', label: reportListTableLabels.headers.targettedPosition, sortable: true },
  { key: 'observers', label: reportListTableLabels.headers.observersCount, sortable: false },
  { key: 'state', label: reportListTableLabels.headers.state, sortable: true },
  { key: 'dueDate', label: reportListTableLabels.headers.dueDate, sortable: false }
];

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

function formatDueDate(dueDate: { year: number; month: number; day: number } | null): string | null {
  if (!dueDate) return null;
  return new DateOnly(dueDate.year, dueDate.month, dueDate.day).toFormattedString();
}

export interface ReportsTableProps {
  reports: DetailedSessionReport[];
  isLoading: boolean;
  filters: ReportFiltersState;
  setFilters: (filters: ReportFiltersState) => void;
  setSort: (field: string) => void;
  getSortIcon: (field: string) => 'fr-icon-arrow-down-line' | 'fr-icon-arrow-up-line';
  pagination: ReportListPaginationProps;
}

export const ReportsTable: React.FC<React.PropsWithChildren<ReportsTableProps>> = ({
  reports,
  isLoading,
  filters,
  setFilters,
  setSort,
  getSortIcon,
  pagination,
  children
}) => {
  const handleFilterChange = (states: NominationFile.ReportState[]) => {
    setFilters({ ...filters, states });
  };

  const headersWithSort = HEADERS.map((header) => (
    <span key={header.key} className="flex items-center gap-1">
      {header.label}
      {header.sortable && (
        <SortButton
          iconId={getSortIcon(header.key)}
          onClick={() => setSort(header.key)}
          label={header.label}
        />
      )}
    </span>
  ));

  return (
    <div>
      <div className="flex items-center justify-between">
        <FiltresRapports states={filters.states} onStatesChange={handleFilterChange} />
        {children}
      </div>

      <div className="mb-6">
        <Table
          id="reports-table"
          headers={headersWithSort}
          bordered
          className="mb-0"
          data={reports.map((report) => [
            <div key={`folder-${report.id}`}>{report.folderNumber ?? 'Profilé'}</div>,
            <Link key={`name-${report.id}`} to={getGdsReportPath(report.id)}>
              {report.name}
            </Link>,
            <div key={`grade-${report.id}`}>{gradeToLabel(report.grade)}</div>,
            <div key={`target-${report.id}`}>{report.targettedPosition}</div>,
            <div key={`observers-${report.id}`}>{formatObserversList(report.observers)}</div>,
            <ReportStateTag key={`state-${report.id}`} state={report.state} />,
            <div key={`due-${report.id}`}>{formatDueDate(report.dueDate)}</div>
          ])}
        />

        {isLoading ? (
          <p className="mb-0 border border-t-0 border-solid border-[#808080] bg-fr-gray-bg py-4 text-center text-gray-600">
            Chargement...
          </p>
        ) : reports.length === 0 ? (
          <p className="mb-0 border border-t-0 border-solid border-[#808080] bg-fr-gray-bg py-4 text-center text-gray-600">
            Aucun résultat ne correspond aux valeurs filtrées
          </p>
        ) : null}
      </div>

      <TableControl
        onChange={pagination.setLimit}
        itemsPerPage={pagination.limit}
        totalItems={pagination.totalItems}
        displayedItems={pagination.displayedItems}
        totalPages={pagination.totalPages}
        currentPage={pagination.currentPage}
        setCurrentPage={pagination.setPage}
        getPageUrl={pagination.getPageUrl}
        label={{ one: 'rapport', other: 'rapports' }}
      />
    </div>
  );
};
