import Tag from '@codegouvfr/react-dsfr/Tag';
import { createColumnHelper, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import clsx from 'clsx';
import { useCallback, useMemo } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { PinnedHeader } from '@/shared/components/pinned-header';
import { RoleEnumMessages } from '@/shared/enums/role.enum';
import {
  DataTable,
  DataTableCount,
  DataTableFilters,
  useDataTableSearch,
  useDataTableUrlState,
} from '@/shared/ui/data-table';
import { IconLink } from '@/shared/ui/icon-link';
import { SearchInput } from '@/shared/ui/search-input';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { capitalize } from '@/utils/string.utils';
import type { PaginatedMemberListItemDto } from '@api/types';
import { type MembersSorting, useInfiniteMembersQuery } from '@queries/members.queries';

const FORMATION_LABELS = defineMessages({
  COMMUN: { defaultMessage: 'Commun' },
  PARQUET: { defaultMessage: 'Parquet' },
  SIEGE: { defaultMessage: 'Siège' },
});

type ListedMember = PaginatedMemberListItemDto['items'][number];

const h = createColumnHelper<ListedMember>();
function useMemberColumns() {
  const { formatMessage } = useIntl();

  return useMemo(
    () => [
      h.accessor('lastName', {
        cell: ({ getValue }) => <span className="uppercase">{getValue()}</span>,
        enableSorting: true,
        header: formatMessage({ defaultMessage: 'Nom de famille' }),
        id: 'lastName',
        size: 220,
      }),

      h.accessor('firstName', {
        cell: ({ getValue }) => <span className="capitalize">{getValue()}</span>,
        enableSorting: true,
        header: formatMessage({ defaultMessage: 'Prénom' }),
        id: 'firstName',
        size: 220,
      }),

      h.accessor('role', {
        cell: ({ getValue }) => <FormattedMessage {...RoleEnumMessages[getValue()]} />,
        enableSorting: false,
        header: formatMessage({ defaultMessage: 'Formation' }),
        id: 'formation',
        meta: {
          filters: {
            filterId: 'formation',
            label: formatMessage({ defaultMessage: 'Formation' }),
            type: 'enum',
            values: (['COMMUN', 'PARQUET', 'SIEGE'] as const).map((id) => ({
              id,
              label: formatMessage(FORMATION_LABELS[id]),
            })),
          },
        },
        size: 260,
      }),

      h.accessor('excludedJurisdictions', {
        cell: ({ getValue }) =>
          getValue().length === 0 ? (
            '-'
          ) : (
            <ul className="fr-m-0 fr-p-0 flex list-none flex-wrap gap-1">
              {getValue().map(({ id, label }) => (
                <li className="fr-p-0" key={id}>
                  <Tag small>{label ?? id}</Tag>
                </li>
              ))}
            </ul>
          ),
        enableSorting: false,
        header: formatMessage({ defaultMessage: 'Juridiction(s) exclue(s)' }),
        id: 'excludedJurisdictions',
        size: 300,
      }),

      h.display({
        cell: ({ row }) => {
          const label = formatMessage(
            { defaultMessage: 'Éditer {name}' },
            { name: `${capitalize(row.original.firstName)} ${row.original.lastName.toUpperCase()}` },
          );
          return (
            <IconLink
              iconId="fr-icon-edit-fill"
              label={label}
              small
              to={ROUTE_PATHS.SG.MANAGE_SINGLE_MEMBER.replace(':userId', row.original.id)}
            />
          );
        },
        id: 'edit',
        size: 80,
      }),
    ],
    [formatMessage],
  );
}

export function MemberList() {
  const { formatMessage } = useIntl();
  const { onColumnFiltersChange, onSortingChange, setTableState, tableState } = useDataTableUrlState({
    columnFilters: [] as { id: 'formation'; value: ('COMMUN' | 'PARQUET' | 'SIEGE')[] }[],
    globalFilter: '',
    sorting: [] as MembersSorting,
  });

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteMembersQuery({
    filters: {
      formations: tableState.columnFilters.find(({ id }) => id === 'formation')?.value,
      search: tableState.globalFilter,
    },
    sorting: tableState.sorting,
  });

  const search = useDataTableSearch(tableState.globalFilter ?? '', (globalFilter) =>
    setTableState((state) => ({ ...state, globalFilter })),
  );

  const fetchMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const columns = useMemberColumns();
  const isFiltered =
    !!tableState.globalFilter || tableState.columnFilters.some(({ value }) => value.length > 0);

  const members = useMemo(() => data?.items ?? [], [data]);
  const table = useReactTable({
    columns,
    data: members,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    manualFiltering: true,
    manualSorting: true,
    onColumnFiltersChange,
    onSortingChange,
    state: {
      columnFilters: tableState.columnFilters,
      globalFilter: tableState.globalFilter,
      sorting: tableState.sorting,
    },
  });

  return (
    <PinnedHeader
      bar={(isPinned) => (
        <div className={clsx('flex flex-col gap-y-6', { 'fr-container': isPinned })}>
          <h1 className="fr-h3 fr-mb-0">
            <FormattedMessage defaultMessage="Membres" />
            {data && <DataTableCount loaded={members.length} total={data.totalCount} />}
          </h1>
          <div className="flex items-center justify-between gap-4">
            <DataTableFilters table={table} />
            <SearchInput
              className="w-72"
              onChange={search.onChange}
              onClear={search.clear}
              placeholder={formatMessage({ defaultMessage: 'Rechercher un membre' })}
              value={search.value}
            />
          </div>
        </div>
      )}
      pinnedBarClassName="fr-pt-6v"
      contentClassName="flex flex-col gap-y-6"
    >
      <DataTable
        ariaLabel={formatMessage({ defaultMessage: 'Liste des membres' })}
        emptyLabel={
          isFiltered
            ? formatMessage({ defaultMessage: 'Aucun membre ne correspond aux filtres fournis' })
            : formatMessage({ defaultMessage: 'Aucun membre' })
        }
        fluid
        isLoading={isLoading}
        onEndReached={fetchMore}
        scrollsWithPage
        table={table}
      />
    </PinnedHeader>
  );
}
