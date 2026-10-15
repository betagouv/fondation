import Button from '@codegouvfr/react-dsfr/Button';
import { createColumnHelper, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import clsx from 'clsx';
import { useMemo } from 'react';
import { defineMessage, FormattedMessage, useIntl } from 'react-intl';
import { generatePath, Link } from 'react-router';

import { FormationBadge } from '@/shared/components/formation-badge';
import { PinnedHeader } from '@/shared/components/pinned-header';
import { FormationEnum, FormationEnumMessages } from '@/shared/enums/formation.enum';
import { Breadcrumb } from '@/shared/ui/Breadcrumb';
import { DataTable, DataTableCount, DataTableFilters, useDataTableUrlState } from '@/shared/ui/data-table';
import { formatDateOnly } from '@/utils/date-only.util';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { capitalize } from '@/utils/string.utils';
import type { ListedArchivedNominationSessionsDto } from '@api/types';
import {
  type ArchivedSessionsSorting,
  useInfiniteArchivedGdsNominationSessionsQuery,
} from '@queries/archived-nomination-sessions.queries';

type ArchivedSession = ListedArchivedNominationSessionsDto['items'][number];

const h = createColumnHelper<ArchivedSession>();
function useArchivedSessionColumns() {
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
    ],
    [formatMessage],
  );
}

const ARCHIVED_SESSIONS_LABEL = defineMessage({
  defaultMessage: '{count, plural, one {session archivée} other {sessions archivées}}',
});

export function ManageArchivedSessions() {
  const { formatMessage } = useIntl();

  const { onColumnFiltersChange, onSortingChange, tableState } = useDataTableUrlState({
    columnFilters: [] as { id: 'formation'; value: FormationEnum[] }[],
    sorting: [] as ArchivedSessionsSorting,
  });

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteArchivedGdsNominationSessionsQuery({
      filters: { formations: tableState.columnFilters.find(({ id }) => id === 'formation')?.value },
      sorting: tableState.sorting,
    });

  const columns = useArchivedSessionColumns();
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
        ariaLabel={formatMessage({ defaultMessage: "Fil d'Ariane des sessions archivées" })}
        breadcrumb={{
          currentPageLabel: formatMessage({ defaultMessage: 'Sessions archivées' }),
          segments: [
            { label: formatMessage({ defaultMessage: 'Secrétariat général' }), to: ROUTE_PATHS.SG.DASHBOARD },
          ],
        }}
        id="archived-sessions-breadcrumb"
      />

      <PinnedHeader
        bar={(isPinned) => (
          <div className={clsx('flex flex-col gap-y-6', { 'fr-container': isPinned })}>
            <h1 className="fr-h3 fr-mb-0">
              <FormattedMessage defaultMessage="Sessions archivées" />
            </h1>
            <div className="flex items-center justify-between gap-4">
              <DataTableFilters table={table} />
              {data && (
                <DataTableCount
                  className="self-end text-sm text-(--text-mention-grey)"
                  label={ARCHIVED_SESSIONS_LABEL}
                  loaded={sessions.length}
                  total={data.totalCount}
                />
              )}
            </div>
          </div>
        )}
        barClassName="fr-pb-2v"
        pinnedBarClassName="fr-pt-6v"
        contentClassName="flex flex-col gap-y-6"
      >
        <DataTable
          ariaLabel={formatMessage({ defaultMessage: 'Liste des sessions archivées' })}
          emptyLabel={
            isFiltered
              ? formatMessage({
                  defaultMessage: 'Aucune session archivée ne correspond aux filtres fournis',
                })
              : formatMessage({ defaultMessage: 'Aucune session archivée' })
          }
          fluid
          isLoading={isLoading}
          scrollsWithPage
          table={table}
          unvirtualized
        />
        {hasNextPage && (
          <Button
            className="self-center"
            disabled={isFetchingNextPage}
            onClick={() => void fetchNextPage()}
            priority="secondary"
            size="small"
          >
            <FormattedMessage defaultMessage="Voir plus" />
          </Button>
        )}
      </PinnedHeader>
    </>
  );
}
