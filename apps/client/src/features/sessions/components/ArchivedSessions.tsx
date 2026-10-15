import { createColumnHelper, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import clsx from 'clsx';
import { useCallback, useMemo } from 'react';
import { defineMessage, FormattedMessage, useIntl } from 'react-intl';
import { generatePath, Link } from 'react-router';

import { FormationBadge } from '@/shared/components/formation-badge';
import { PinnedHeader } from '@/shared/components/pinned-header';
import { FormationEnum, FormationEnumMessages } from '@/shared/enums/formation.enum';
import { Breadcrumb } from '@/shared/ui/Breadcrumb';
import {
  DataTable,
  DataTableCount,
  DataTableFilters,
  useDataTableSearch,
  useDataTableUrlState,
} from '@/shared/ui/data-table';
import { SearchInput } from '@/shared/ui/search-input';
import { formatDateOnly } from '@/utils/date-only.util';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { capitalize } from '@/utils/string.utils';
import type { ListedArchivedNominationSessionsDto } from '@api/types';
import {
  type ArchivedSessionsSorting,
  useInfiniteArchivedGdsNominationSessionsQuery,
} from '@queries/archived-nomination-sessions.queries';

type ArchivedSession = ListedArchivedNominationSessionsDto['items'][number];
const SPACES = {
  SG: {
    home: ROUTE_PATHS.SG.DASHBOARD,
    label: defineMessage({ defaultMessage: 'Secrétariat général' }),
    session: ROUTE_PATHS.SG.SESSION_ID,
  },
  TRANSPARENCES: {
    home: ROUTE_PATHS.TRANSPARENCES.DASHBOARD,
    label: defineMessage({ defaultMessage: 'Transparences' }),
    session: ROUTE_PATHS.TRANSPARENCES.DETAIL_SESSION_GDS,
  },
};
type Space = keyof typeof SPACES;

const h = createColumnHelper<ArchivedSession>();
function useArchivedSessionColumns(props: { space: Space; withFormationFilter: boolean }) {
  const { formatDate, formatMessage } = useIntl();

  return useMemo(
    () => [
      h.accessor('proposingAuthority.label', {
        enableSorting: false,
        header: formatMessage({ defaultMessage: 'Type de session' }),
        id: 'proposingAuthority',
        size: 180,
      }),

      h.accessor('typeDeSaisine.label', {
        enableSorting: false,
        header: formatMessage({ defaultMessage: 'Sous-type de session' }),
        id: 'typeDeSaisine',
        size: 180,
      }),

      h.accessor('name', {
        cell: ({ row }) => (
          <Link to={generatePath(SPACES[props.space].session, { sessionId: row.original.id })}>
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
        meta: props.withFormationFilter
          ? {
              filters: {
                filterId: 'formation',
                label: formatMessage({ defaultMessage: 'Formation' }),
                multiple: false,
                type: 'enum',
                values: Object.values(FormationEnum).map((id) => ({
                  id,
                  label: capitalize(formatMessage(FormationEnumMessages[id])),
                })),
              },
            }
          : undefined,
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

      h.accessor('archivedAt', {
        cell: ({ getValue }) => formatDate(getValue(), { format: 'zonedDateShort' }),
        enableSorting: true,
        header: formatMessage({ defaultMessage: "Date d'archivage" }),
        id: 'archivedAt',
        size: 180,
        sortDescFirst: true,
      }),
    ],
    [formatDate, formatMessage, props.space, props.withFormationFilter],
  );
}

const DEFAULT_SORTING: ArchivedSessionsSorting = [{ desc: true, id: 'archivedAt' }];
const SORTABLE_COLUMNS = new Set<string>([
  'archivedAt',
  'date',
] satisfies ArchivedSessionsSorting[number]['id'][]);

const ARCHIVED_SESSIONS_LABEL = defineMessage({
  defaultMessage: '{count, plural, one {session archivée} other {sessions archivées}}',
});

export function ArchivedSessions(props: { space: Space; withFormationFilter: boolean }) {
  const { formatMessage } = useIntl();

  const { onColumnFiltersChange, onSortingChange, setTableState, tableState } = useDataTableUrlState({
    columnFilters: [] as { id: 'formation'; value: FormationEnum[] }[],
    globalFilter: '',
    sorting: DEFAULT_SORTING,
  });

  // a saved link can carry a sort the API no longer accepts
  const [sort] = tableState.sorting;
  const sorting = sort && SORTABLE_COLUMNS.has(sort.id) ? tableState.sorting : DEFAULT_SORTING;

  // a formation shared in the URL would otherwise filter the table of a member who cannot remove it
  const formations = props.withFormationFilter
    ? tableState.columnFilters.find(({ id }) => id === 'formation')?.value
    : undefined;

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteArchivedGdsNominationSessionsQuery({
      filters: { formations, search: tableState.globalFilter },
      sorting,
    });

  const search = useDataTableSearch(tableState.globalFilter ?? '', (globalFilter) =>
    setTableState((state) => ({ ...state, globalFilter })),
  );

  const fetchMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const columns = useArchivedSessionColumns(props);
  const isFiltered = !!tableState.globalFilter || !!formations?.length;

  const sessions = useMemo(() => data?.items ?? [], [data]);
  const table = useReactTable({
    columns,
    data: sessions,
    enableSortingRemoval: false,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    manualFiltering: true,
    manualSorting: true,
    onColumnFiltersChange,
    onSortingChange,
    state: {
      columnFilters: tableState.columnFilters,
      globalFilter: tableState.globalFilter,
      sorting,
    },
  });

  return (
    <>
      <Breadcrumb
        ariaLabel={formatMessage({ defaultMessage: "Fil d'Ariane des sessions archivées" })}
        breadcrumb={{
          currentPageLabel: formatMessage({ defaultMessage: 'Sessions archivées' }),
          segments: [{ label: formatMessage(SPACES[props.space].label), to: SPACES[props.space].home }],
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
              {props.withFormationFilter && <DataTableFilters table={table} />}
              <div className="ml-auto flex items-center gap-4">
                {data && (
                  <DataTableCount
                    className="text-sm text-(--text-mention-grey)"
                    label={ARCHIVED_SESSIONS_LABEL}
                    loaded={sessions.length}
                    total={data.totalCount}
                  />
                )}
                <SearchInput
                  className="w-72"
                  onChange={search.onChange}
                  onClear={search.clear}
                  placeholder={formatMessage({ defaultMessage: 'Rechercher une session' })}
                  value={search.value}
                />
              </div>
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
          onEndReached={fetchMore}
          scrollsWithPage
          table={table}
        />
      </PinnedHeader>
    </>
  );
}
