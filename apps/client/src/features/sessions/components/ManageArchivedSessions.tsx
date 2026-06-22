import { createColumnHelper } from '@tanstack/react-table';
import { format } from 'date-fns';
import { defineMessage } from 'react-intl';
import { generatePath, Link } from 'react-router';

import type { BreadcrumbVM } from '@/shared/ui/Breadcrumb';
import { Breadcrumb } from '@/shared/ui/Breadcrumb';
import { DataTable, useDataTable, useQueryDataTableState } from '@/shared/ui/data-table';
import { dateOnlyToDate } from '@/utils/date-only.util';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import type { ListedArchivedNominationSessionsDto } from '@api/types';
import { useListedArchivedGdsNominationSessionsQuery } from '@queries/archived-nomination-sessions.queries';

const h = createColumnHelper<ListedArchivedNominationSessionsDto['items'][number]>();
const columns = [
  h.accessor('name', {
    id: 'name',
    enableSorting: false,
    enableHiding: false,
    header: 'Intitulé de la session',
    cell: ({ row }) => (
      <Link to={generatePath(ROUTE_PATHS.SG.SESSION_ID, { sessionId: row.original.id })}>
        {row.original.name}
      </Link>
    ),
  }),

  h.accessor('formation', {
    id: 'formation',
    enableSorting: false,
    header: 'Formation',
    meta: {
      filters: {
        type: 'enum',
        filterId: 'formation',
        label: 'Formation',
        values: [
          { id: 'PARQUET', label: 'Parquet' },
          { id: 'SIEGE', label: 'Siège' },
        ],
      },
    },
  }),

  h.accessor('date', {
    id: 'date',
    enableSorting: true,
    sortDescFirst: false,
    header: 'Date de publication',
    cell: ({ cell }) => format(dateOnlyToDate(cell.getValue()), 'dd/MM/yyyy'),
  }),

  h.accessor('dueDate', {
    id: 'dueDate',
    enableSorting: false,
    header: "Date d'échéance",
    cell: ({ cell }) => {
      const val = cell.getValue();
      return val ? format(dateOnlyToDate(val), 'dd/MM/yyyy') : null;
    },
  }),
];

const breadcrumb: BreadcrumbVM = {
  currentPageLabel: 'Sessions archivées',
  segments: [{ label: 'Secrétariat général', to: ROUTE_PATHS.SG.DASHBOARD }],
};

export function ManageArchivedSessions() {
  const [tableState, setTableState] = useQueryDataTableState({
    pagination: { pageIndex: 0, pageSize: 50 },
    columnFilters: [] as { id: 'formation'; value: ('PARQUET' | 'SIEGE')[] }[],
    sorting: [] as [{ id: 'date' | 'dueDate'; desc: boolean }] | [],
  });

  const formations = tableState.columnFilters?.find(({ id }) => id === 'formation')?.value;

  const { data, isLoading } = useListedArchivedGdsNominationSessionsQuery({
    pagination: tableState.pagination,
    sorting: tableState.sorting,
    filters: { formations },
  });

  const table = useDataTable({
    columns,
    data: data?.items,
    getRowId: (row) => row.id,
    rowCount: data?.totalCount,
    meta: {
      paginationItemLabel: defineMessage({
        defaultMessage: '{count, plural, one {session} other {sessions}}',
      }),
    },
    state: tableState,
    onStateChange: setTableState,
  });

  return (
    <>
      <Breadcrumb
        id="archived-sessions-breadcrumb"
        ariaLabel="Fil d'Ariane des sessions archivées"
        breadcrumb={breadcrumb}
      />

      <DataTable
        table={table}
        classNames={{ content: 'fr-container' }}
        placeholder={isLoading ? 'Chargement...' : 'Aucune données ne correspond aux filtres fournis'}
        caption="Liste des sessions archivées"
      />
    </>
  );
}
