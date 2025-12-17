import Alert from '@codegouvfr/react-dsfr/Alert';
import Table from '@codegouvfr/react-dsfr/Table';
import { useQuery } from '@tanstack/react-query';
import { parseAsArrayOf, parseAsStringEnum, useQueryStates } from 'nuqs';
import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { Magistrat, TypeDeSaisineLabels } from 'shared-models';

import { useServerPagination } from '../../../hooks/useServerPagination.hook';
import { DateOnly } from '../../../models/date-only.model';

import type { BreadcrumbVM } from '../../../models/breadcrumb-vm.model';

import { Breadcrumb } from '../../shared/Breadcrumb';
import { SortButton } from '../../shared/SortButton';
import { TableControl } from '../../shared/TableControl';

import {
  listGdsNominationSessionsQuery,
  type SessionSortField
} from '../../../react-query/mutations/sg/nomination-sessions';

import { getSgSessionPath, ROUTE_PATHS } from '../../../utils/route-path.utils';
import { FiltresSessions } from './FiltresSessions';

type HeaderColumn = {
  field: string;
  label: string;
  sortKey?: SessionSortField;
};

const HEADERS_COLUMNS: HeaderColumn[] = [
  { field: 'typeDeSaisine', label: 'Type de session' },
  { field: 'name', label: 'Intitulé de la session', sortKey: 'name' },
  { field: 'formation', label: 'Formation', sortKey: 'formation' },
  { field: 'dateTransparence', label: 'Date de publication', sortKey: 'date' },
  { field: 'dateEcheance', label: "Date d'écheance", sortKey: 'dueDate' },
  { field: 'status', label: 'Statut' }
];

export const ManageSession = () => {
  const location = useLocation();
  const successSessionImportTitle = location.state?.success ?? undefined;

  const { page, limit, sortField, sortDirection, setPage, setLimit, setSort, getPageUrl, getSortIcon } =
    useServerPagination({ defaultLimit: 50 });

  const [filters, setFilters] = useQueryStates({
    formations: parseAsArrayOf(parseAsStringEnum(Object.values(Magistrat.Formation))).withDefault([])
  });

  const { data: sessionsResponse } = useQuery({
    queryKey: ['listed-gds-nomination-sessions', { page, limit, sortField, sortDirection, formations: filters.formations }],
    queryFn: () =>
      listGdsNominationSessionsQuery({
        page,
        limit,
        sortField: sortField as SessionSortField | null,
        sortDirection,
        formations: filters.formations as Magistrat.Formation[]
      })
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

  const paginatedData = sessionsResponse?.items ?? [];
  const totalItems = sessionsResponse?.totalCount ?? 0;
  const currentPage = sessionsResponse?.currentPageIndex ?? 1;
  const totalPages = Math.ceil(totalItems / limit);
  const displayedItems = paginatedData.length;

  const handleSort = (field: string) => {
    const column = HEADERS_COLUMNS.find((c) => c.field === field);
    if (column?.sortKey) {
      setSort(column.sortKey);
    }
  };

  const headers: ReactNode[] = HEADERS_COLUMNS.map((header) => (
    <span key={header.field} className="flex items-center gap-1">
      {header.label}
      {header.sortKey && (
        <SortButton
          iconId={getSortIcon(header.sortKey)}
          onClick={() => handleSort(header.field)}
          label={header.label}
        />
      )}
    </span>
  ));

  const sessionRows = paginatedData.map((session) => {
    const href = getSgSessionPath(session.id);
    return [
      TypeDeSaisineLabels[session.typeDeSaisine],
      <Link key={session.id} to={href}>{session.name.toUpperCase()}</Link>,
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
        totalItems={totalItems}
        displayedItems={displayedItems}
        totalPages={totalPages}
        currentPage={currentPage}
        setCurrentPage={setPage}
        getPageUrl={getPageUrl}
        label={{ one: 'session', other: 'sessions' }}
      />
    </>
  );
};
