import Alert from '@codegouvfr/react-dsfr/Alert';
import { createColumnHelper, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import clsx from 'clsx';
import { useCallback, useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { generatePath, Link, useLocation } from 'react-router';

import { FormationBadge } from '@/shared/components/formation-badge';
import { PinnedHeader } from '@/shared/components/pinned-header';
import { FormationEnum, FormationEnumMessages } from '@/shared/enums/formation.enum';
import { Breadcrumb } from '@/shared/ui/Breadcrumb';
import { DataTable, DataTableCount, DataTableFilters, useDataTableUrlState } from '@/shared/ui/data-table';
import { formatDateOnly } from '@/utils/date-only.util';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { capitalize } from '@/utils/string.utils';
import type { ListedNominationSessionsDto } from '@api/types';
import {
  type GdsSessionsSorting,
  useInfiniteGdsNominationSessionsQuery,
} from '@queries/nomination-sessions.queries';

import { SessionStatusBadge } from './SessionStatusBadge';

type ManagedSession = ListedNominationSessionsDto['items'][number];

const h = createColumnHelper<ManagedSession>();
function useManagedSessionColumns() {
  const { formatMessage } = useIntl();

  return useMemo(
    () => [
      h.accessor('name', {
        cell: ({ row }) => (
          <Link to={generatePath(ROUTE_PATHS.SG.SESSION_ID, { sessionId: row.original.id })}>
            {row.original.name}
          </Link>
        ),
        enableSorting: false,
        header: formatMessage({ defaultMessage: 'Intitulé de la session' }),
        id: 'name',
        size: 360,
      }),

      h.accessor('formation', {
        cell: ({ getValue }) => <FormationBadge formation={getValue()} small />,
        enableSorting: false,
        header: formatMessage({ defaultMessage: 'Formation' }),
        id: 'formation',
        meta: {
          filters: {
            filterId: 'formation',
            label: formatMessage({ defaultMessage: 'Formation' }),
            type: 'enum',
            values: Object.values(FormationEnum).map((id) => ({
              id,
              label: capitalize(formatMessage(FormationEnumMessages[id])),
            })),
          },
        },
        size: 140,
      }),

      h.accessor('date', {
        cell: ({ getValue }) => formatDateOnly(getValue()),
        enableSorting: true,
        header: formatMessage({ defaultMessage: 'Date de publication' }),
        id: 'date',
        size: 180,
        sortDescFirst: false,
      }),

      h.accessor('dueDate', {
        cell: ({ getValue }) => {
          const dueDate = getValue();
          return dueDate ? formatDateOnly(dueDate) : null;
        },
        enableSorting: true,
        header: formatMessage({ defaultMessage: "Date d'échéance" }),
        id: 'dueDate',
        size: 180,
      }),

      h.accessor('status', {
        cell: ({ getValue }) => <SessionStatusBadge status={getValue()} />,
        enableSorting: false,
        header: formatMessage({ defaultMessage: 'Statut' }),
        id: 'status',
        size: 160,
      }),
    ],
    [formatMessage],
  );
}

export function ManageSession() {
  const { formatMessage } = useIntl();
  const location = useLocation();
  const successSessionImportTitle = location.state?.success ?? undefined;

  const { onColumnFiltersChange, onSortingChange, tableState } = useDataTableUrlState({
    columnFilters: [] as { id: 'formation'; value: FormationEnum[] }[],
    sorting: [] as GdsSessionsSorting,
  });

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteGdsNominationSessionsQuery({
      filters: { formations: tableState.columnFilters.find(({ id }) => id === 'formation')?.value },
      sorting: tableState.sorting,
    });

  const fetchMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const columns = useManagedSessionColumns();
  const isFiltered = tableState.columnFilters.some(({ value }) => value.length > 0);

  const sessions = useMemo(() => data?.items ?? [], [data]);
  const table = useReactTable({
    columns,
    data: sessions,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    manualFiltering: true,
    manualSorting: true,
    onColumnFiltersChange,
    onSortingChange,
    state: { columnFilters: tableState.columnFilters, sorting: tableState.sorting },
  });

  return (
    <>
      <Breadcrumb
        ariaLabel={formatMessage({ defaultMessage: "Fil d'Ariane de la gestion des sessions" })}
        breadcrumb={{
          currentPageLabel: formatMessage({ defaultMessage: 'Gérer une session' }),
          segments: [
            { label: formatMessage({ defaultMessage: 'Secrétariat général' }), to: ROUTE_PATHS.SG.DASHBOARD },
          ],
        }}
        id="manage-sessions-breadcrumb"
      />

      {successSessionImportTitle && (
        <Alert
          className="fr-mt-6v"
          closable
          severity="success"
          title={`Session «\u00A0${successSessionImportTitle}\u00A0» créée`}
        />
      )}

      <PinnedHeader
        bar={(isPinned) => (
          <div className={clsx('flex flex-col gap-y-6', { 'fr-container': isPinned })}>
            <h1 className="fr-h3 fr-mb-0">
              <FormattedMessage defaultMessage="Gérer une session" />
              {data && <DataTableCount loaded={sessions.length} total={data.totalCount} />}
            </h1>
            <DataTableFilters table={table} />
          </div>
        )}
        barClassName="fr-pb-2v"
        pinnedBarClassName="fr-pt-6v"
        contentClassName="flex flex-col gap-y-6"
      >
        <DataTable
          ariaLabel={formatMessage({ defaultMessage: 'Liste des sessions' })}
          emptyLabel={
            isFiltered
              ? formatMessage({ defaultMessage: 'Aucune session ne correspond aux filtres fournis' })
              : formatMessage({ defaultMessage: 'Aucune session' })
          }
          fluid
          isLoading={isLoading}
          onEndReached={fetchMore}
          scrollsWithPage
          table={table}
        />
      </PinnedHeader>
    </>
  );
}
