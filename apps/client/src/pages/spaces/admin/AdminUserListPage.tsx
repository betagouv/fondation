import { createColumnHelper, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import clsx from 'clsx';
import { useCallback, useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { generatePath } from 'react-router';

import { AdminUserRole } from '@/features/administration/components/AdminUserRole';
import { ROLE_OPTIONS, type AdminUserRoleEnum } from '@/features/administration/labels/admin-user-enum';
import { PinnedHeader } from '@/shared/components/pinned-header';
import { UserStatusBadge } from '@/shared/components/user-status-badge';
import { UserStatusEnum, UserStatusEnumMessages } from '@/shared/enums/user-status.enum';
import { Breadcrumb } from '@/shared/ui/Breadcrumb';
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
import type { PaginatedAdminUserListItemDto } from '@api/types';
import { type AdminUsersSorting, useInfiniteAdminUsersQuery } from '@queries/administration.queries';

type AdminUserItem = PaginatedAdminUserListItemDto['items'][number];
const h = createColumnHelper<AdminUserItem>();

function useAdminUserColumns() {
  const { formatMessage } = useIntl();

  return useMemo(
    () => [
      h.accessor('lastName', {
        cell: ({ getValue }) => <span className="uppercase">{getValue()}</span>,
        enableSorting: true,
        header: formatMessage({ defaultMessage: 'Nom' }),
        id: 'lastName',
        size: 220,
        sortDescFirst: true,
      }),

      h.accessor('firstName', {
        cell: ({ getValue }) => <span className="capitalize">{getValue()}</span>,
        enableSorting: false,
        header: formatMessage({ defaultMessage: 'Prénom' }),
        id: 'firstName',
        size: 200,
      }),

      h.accessor('email', {
        enableSorting: false,
        header: formatMessage({ defaultMessage: 'Email' }),
        id: 'email',
        size: 320,
      }),

      h.accessor('role', {
        cell: ({ getValue, row }) => <AdminUserRole gender={row.original.gender} value={getValue()} />,
        enableSorting: false,
        header: formatMessage({ defaultMessage: 'Rôle' }),
        id: 'role',
        meta: {
          filters: {
            filterId: 'role',
            label: formatMessage({ defaultMessage: 'Rôle' }),
            type: 'enum',
            values: ROLE_OPTIONS.flatMap((group) =>
              group.options.map(({ id, label }) => ({
                id,
                label: formatMessage(label, { gender: undefined }),
              })),
            ),
          },
        },
        size: 260,
      }),

      h.accessor('status', {
        cell: ({ getValue }) => <UserStatusBadge status={getValue()} />,
        enableSorting: false,
        header: formatMessage({ defaultMessage: 'Compte' }),
        id: 'status',
        meta: {
          filters: {
            filterId: 'status',
            label: formatMessage({ defaultMessage: 'Compte' }),
            type: 'enum',
            values: Object.values(UserStatusEnum).map((status) => ({
              id: status,
              label: formatMessage(UserStatusEnumMessages[status]),
            })),
          },
        },
        size: 140,
      }),

      h.display({
        cell: ({ row }) => <EditButton user={row.original} />,
        id: 'edit',
        size: 80,
      }),
    ],
    [formatMessage],
  );
}

function EditButton(props: { user: AdminUserItem }) {
  const { formatMessage } = useIntl();
  const label = formatMessage(
    { defaultMessage: 'Éditer {firstName} {lastName}' },
    { firstName: capitalize(props.user.firstName), lastName: props.user.lastName.toUpperCase() },
  );

  return (
    <IconLink
      iconId="fr-icon-edit-fill"
      label={label}
      small
      to={generatePath(ROUTE_PATHS.ADMIN.USER_DETAIL, { userId: props.user.id })}
    />
  );
}

export function AdminUserListPage() {
  const { formatMessage } = useIntl();
  const { onColumnFiltersChange, onSortingChange, setTableState, tableState } = useDataTableUrlState({
    columnFilters: [] as (
      | { id: 'role'; value: AdminUserRoleEnum[] }
      | { id: 'status'; value: AdminUserItem['status'][] }
    )[],
    globalFilter: '',
    sorting: [] as AdminUsersSorting,
  });

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteAdminUsersQuery({
    filters: {
      roles: tableState.columnFilters.find((filter) => filter.id === 'role')?.value,
      search: tableState.globalFilter,
      statuses: tableState.columnFilters.find((filter) => filter.id === 'status')?.value,
    },
    sorting: tableState.sorting,
  });

  const search = useDataTableSearch(tableState.globalFilter ?? '', (globalFilter) =>
    setTableState((state) => ({ ...state, globalFilter })),
  );

  const fetchMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const columns = useAdminUserColumns();
  const isFiltered =
    !!tableState.globalFilter || tableState.columnFilters.some(({ value }) => value.length > 0);

  const users = useMemo(() => data?.items ?? [], [data]);
  const table = useReactTable({
    columns,
    data: users,
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
    <div className="fr-container fr-pt-8v fr-pb-16v">
      <Breadcrumb
        ariaLabel={formatMessage({ defaultMessage: "Fil d'Ariane pour l'Administration" })}
        breadcrumb={{
          currentPageLabel: formatMessage({ defaultMessage: 'Utilisateurs' }),
          segments: [{ label: formatMessage({ defaultMessage: 'Administration' }), to: {} }],
        }}
        id="administration-breadcrumb"
      />

      <PinnedHeader
        bar={(isPinned) => (
          <div className={clsx('flex flex-col gap-y-6', { 'fr-container': isPinned })}>
            <h1 className="fr-h3 fr-mb-0">
              <FormattedMessage defaultMessage="Utilisateurs" />
              {data && <DataTableCount loaded={users.length} total={data.totalCount} />}
            </h1>
            <div className="flex items-center justify-between gap-4">
              <DataTableFilters table={table} />
              <SearchInput
                className="w-72"
                onChange={search.onChange}
                onClear={search.clear}
                placeholder={formatMessage({ defaultMessage: 'Rechercher un utilisateur' })}
                value={search.value}
              />
            </div>
          </div>
        )}
        pinnedBarClassName="fr-pt-6v"
        contentClassName="flex flex-col gap-y-6"
      >
        <DataTable
          ariaLabel={formatMessage({ defaultMessage: 'Liste des utilisateurs' })}
          emptyLabel={
            isFiltered
              ? formatMessage({ defaultMessage: 'Aucun utilisateur ne correspond aux filtres fournis' })
              : formatMessage({ defaultMessage: 'Aucun utilisateur' })
          }
          fluid
          isLoading={isLoading}
          onEndReached={fetchMore}
          scrollsWithPage
          table={table}
        />
      </PinnedHeader>
    </div>
  );
}
