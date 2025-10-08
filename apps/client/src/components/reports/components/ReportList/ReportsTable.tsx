import { Table } from '@codegouvfr/react-dsfr/Table';
import { useState } from 'react';

import type { ReportListItemVM, ReportListVM } from '../../../../utils/format-report-list.utils';
import './ReportsTable.css';
import { ReportStateTag } from './ReportStateTag';
import { SortButton } from '../../../shared/SortButton';
import { useTable } from '../../../../hooks/useTable.hook';
import { TableControl } from '../../../shared/TableControl';
import { FiltresRapports, type ReportFiltersState } from './FiltresRapports';

// Fonction de filtrage des rapports
const applyReportFilters = (reports: ReportListItemVM[], filters: ReportFiltersState) => {
  return reports.filter((report) => {
    // Filtre par statut
    if (filters.statuts.length > 0) {
      if (!filters.statuts.includes(report.state)) {
        return false;
      }
    }

    return true;
  });
};

export type ReportsTableProps = {
  headers: ReportListVM['headers'];
  reports: ReportListItemVM[];
};

export const ReportsTable: React.FC<ReportsTableProps> = ({ headers, reports }) => {
  const [filters, setFilters] = useState<ReportFiltersState>({
    statuts: []
  });

  const {
    data: paginatedData,
    totalPages,
    currentPage,
    totalItems,
    displayedItems,
    itemsPerPage,
    setCurrentPage,
    setItemsPerPage,
    handleSort,
    getSortIcon
  } = useTable<NonNullable<typeof reports>[0], ReportFiltersState>(reports || [], {
    filters,
    applyFilters: applyReportFilters
  });

  const headersWithSort = Object.entries(headers).map(([key, label]) => (
    <span className="flex items-center gap-1">
      {label}
      <SortButton
        iconId={getSortIcon(key) as 'fr-icon-arrow-down-line' | 'fr-icon-arrow-up-line'}
        onClick={() => handleSort(key)}
        label={label}
      />
    </span>
  ));

  return (
    <div>
      <FiltresRapports filters={filters} onFiltersChange={setFilters} />
      <Table
        id="reports-table"
        headers={headersWithSort}
        bordered
        data={paginatedData.map((report) => [
          <div>{report.folderNumber}</div>,
          <a href={report.href} onClick={report.onClick}>
            {report.name}
          </a>,
          <div>{report.grade}</div>,
          <div>{report.targettedPosition}</div>,
          <ReportStateTag state={report.state} />,
          <div>{report.observersCount}</div>,
          <div>{report.dueDate}</div>
        ])}
      />
      <TableControl
        onChange={setItemsPerPage}
        itemsPerPage={itemsPerPage}
        totalItems={totalItems}
        displayedItems={displayedItems}
        totalPages={totalPages}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />
    </div>
  );
};
