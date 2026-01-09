import Alert from '@codegouvfr/react-dsfr/Alert';
import Table from '@codegouvfr/react-dsfr/Table';
import { parseAsArrayOf, parseAsString, useQueryStates } from 'nuqs';
import { useMemo, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { TypeDeSaisineLabels } from 'shared-models';

import { useServerPagination } from '@/hooks/useServerPagination.hook';
import { DateOnly } from '../../../models/date-only.model';

import type { BreadcrumbVM } from '../../../models/breadcrumb-vm.model';

import { Breadcrumb } from '../../shared/Breadcrumb';
import { SortButton } from '../../shared/SortButton';
import { TableControl } from '../../shared/TableControl';

import { useListedGdsNominationSessionsQuery } from '@queries/nomination-sessions.queries';

import { getSgSessionPath, ROUTE_PATHS } from '../../../utils/route-path.utils';
import { FiltresSessions, type SessionFiltersState } from './FiltresSessions';
import type { PaginatedNominationSessionsDto } from '@api/types';

function applySessionFilters(
  sessions: PaginatedNominationSessionsDto['items'],
  filters: SessionFiltersState
): PaginatedNominationSessionsDto['items'] {
  return sessions.filter((session) => {
    if (filters.formations.length > 0) {
      if (!filters.formations.includes(session.formation)) {
        return false;
      }
    }

    if (filters.typeDeSaisine.length > 0) {
      if (!filters.typeDeSaisine.includes(session.typeDeSaisine)) {
        return false;
      }
    }

    return true;
  });
}

export const ManageSession = () => {
  const location = useLocation();

  const { page, limit, setPage, setLimit, setSort, getSortIcon } = useServerPagination({
    defaultLimit: 50
  });

  const { data: sessionsResponse } = useListedGdsNominationSessionsQuery({ page, limit });

  const successSessionImportTitle = location.state?.success ?? undefined;

  const [filters, setFilters] = useQueryStates({
    formations: parseAsArrayOf(parseAsString).withDefault([]),
    typeDeSaisine: parseAsArrayOf(parseAsString).withDefault([])
  });

  const breadcrumb: BreadcrumbVM = {
    currentPageLabel: 'Gérer une session',
    segments: [
      {
        label: 'Secretariat général',
        to: ROUTE_PATHS.SG.DASHBOARD
      }
    ]
  };

  const filteredData = useMemo(
    () => applySessionFilters(sessionsResponse?.items ?? [], filters),
    [sessionsResponse?.items, filters]
  );

  const totalCount = sessionsResponse?.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / limit);

  const HEADERS_COLUMNS = [
    { field: 'typeDeSaisine', label: 'Type de session' },
    { field: 'name', label: 'Intitulé de la session' },
    { field: 'formation', label: 'Formation' },
    { field: 'dateTransparence', label: 'Date de publication' },
    { field: 'dateEcheance', label: "Date d'écheance" },
    { field: 'status', label: 'Statut' }
  ];

  const headers: ReactNode[] = HEADERS_COLUMNS.map((header) => (
    <span key={header.field} className="flex items-center gap-1">
      {header.label}
      <SortButton
        iconId={getSortIcon(header.field) as 'fr-icon-arrow-down-line' | 'fr-icon-arrow-up-line'}
        onClick={() => setSort(header.field)}
        label={header.label}
      />
    </span>
  ));

  const sessionRows = (filteredData || []).map((session) => {
    const href = getSgSessionPath(session.id);
    return [
      TypeDeSaisineLabels[session.typeDeSaisine],
      <Link to={href}>{session.name.toUpperCase()}</Link>,
      session.formation,
      DateOnly.fromDateOnly(session.date),
      session.dueDate && DateOnly.fromDateOnly(session.dueDate),
      ''
    ];
  });

  return (
    <>
      <Breadcrumb
        id="manage-sessions-breadcrumb"
        ariaLabel="Fil d'Ariane de la gestion des sessions"
        breadcrumb={breadcrumb}
      />

      {successSessionImportTitle && (
        <Alert
          closable
          severity="success"
          title={`Session «\u00A0${successSessionImportTitle}\u00A0» créée`}
          className="mb-10"
        />
      )}

      <FiltresSessions filters={filters} onFiltersChange={setFilters} />

      <div className="mb-4 flex flex-col justify-center">
        <Table
          bordered
          fixed
          className="mb-0 w-full"
          id="all-sessions-table"
          headers={headers}
          data={sessionRows}
        />
        {sessionRows.length === 0 ? (
          <p className="mb-0 border border-t-0 border-solid border-[#808080] bg-fr-gray-bg py-4 text-center text-gray-600">
            Aucun résultat ne correspond aux valeurs filtrées
          </p>
        ) : null}
      </div>
      <TableControl
        onChange={setLimit}
        itemsPerPage={limit}
        totalItems={totalCount}
        displayedItems={filteredData.length}
        totalPages={totalPages}
        currentPage={page}
        setCurrentPage={setPage}
      />
    </>
  );
};
