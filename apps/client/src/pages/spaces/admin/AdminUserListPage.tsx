import Button from '@codegouvfr/react-dsfr/Button';
import { createColumnHelper } from '@tanstack/react-table';
import React from 'react';
import { defineMessage, useIntl } from 'react-intl';
import { generatePath } from 'react-router';

import { AdminUserRole } from '@/features/administration/components/AdminUserRole';
import { ROLE_OPTIONS, type AdminUserRoleEnum } from '@/features/administration/labels/admin-user-enum';
import { Breadcrumb } from '@/shared/ui/Breadcrumb';
import { DataTable, useDataTable, useQueryDataTableState } from '@/shared/ui/data-table';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { capitalize } from '@/utils/string.utils';
import type { PaginatedAdminUserListItemDto } from '@api/types';
import { useAdminUsersQuery } from '@queries/administration.queries';

type AdminUserItem = PaginatedAdminUserListItemDto['items'][number];
const h = createColumnHelper<AdminUserItem>();

function useAdminUserColumns() {
  const { formatMessage } = useIntl();

  return React.useMemo(
    () => [
      h.accessor('lastName', {
        id: 'lastName',
        enableSorting: true,
        enableHiding: false,
        header: 'Nom',
        sortDescFirst: true,
        cell: ({ cell }) => <div className="uppercase">{cell.getValue()}</div>,
      }),

      h.accessor('firstName', {
        id: 'firstName',
        enableSorting: false,
        enableHiding: false,
        header: 'Prénom',
        cell: ({ cell }) => <div className="capitalize">{cell.getValue()}</div>,
      }),

      h.accessor('email', {
        id: 'email',
        enableSorting: false,
        header: 'Email',
      }),

      h.accessor('role', {
        id: 'role',
        enableSorting: false,
        header: 'Rôle',
        cell: ({ cell, row }) => <AdminUserRole value={cell.getValue()} gender={row.original.gender} />,
        meta: {
          filters: {
            type: 'enum',
            filterId: 'role',
            label: 'Rôle',
            values: ROLE_OPTIONS.flatMap((group) =>
              group.options.map(({ id, label }) => ({
                id,
                label: formatMessage(label, { gender: undefined }),
              })),
            ),
          },
        },
      }),

      h.display({
        id: 'edit',
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => <EditButton row={row.original} />,
      }),
    ],
    [formatMessage],
  );
}

function EditButton(props: { row: AdminUserItem }) {
  return (
    <Button
      priority="tertiary no outline"
      className="rounded-full"
      iconId="fr-icon-edit-fill"
      title={`Éditer ${capitalize(props.row.firstName)} ${props.row.lastName.toUpperCase()}`}
      linkProps={{ to: generatePath(ROUTE_PATHS.ADMIN.USER_DETAIL, { userId: props.row.id }) }}
    />
  );
}

export function AdminUserListPage() {
  const [tableState, setTableState] = useQueryDataTableState({
    pagination: { pageIndex: 0, pageSize: 50 },
    columnFilters: [] as { id: 'role'; value: AdminUserRoleEnum[] }[],
    sorting: [] as [],
    globalFilter: '',
  });

  const { data, isLoading } = useAdminUsersQuery({
    search: tableState.globalFilter ?? '',
    pagination: tableState.pagination,
    sorting: tableState.sorting,
    roles: tableState.columnFilters.find(({ id }) => id === 'role')?.value,
  });

  const columns = useAdminUserColumns();

  const table = useDataTable({
    columns,
    data: data?.items,
    getRowId: (row) => row.id,
    rowCount: data?.totalCount,
    meta: {
      paginationItemLabel: defineMessage({
        defaultMessage: `{count, plural, one {utilisateur} other {utilisateurs}}`,
      }),
    },
    state: tableState,
    onStateChange: setTableState,
    enableGlobalFilter: true,
  });

  return (
    <div className="fr-container fr-pt-10v flex flex-col justify-center">
      <Breadcrumb
        id="administration-breadcrumb"
        ariaLabel="Fil d'Ariane pour l'Administration"
        breadcrumb={{
          currentPageLabel: 'Utilisateurs',
          segments: [{ label: 'Administration', to: {} }],
        }}
      />

      <div className="flex flex-col gap-4 lg:mx-auto lg:w-[80%]">
        <h1 className="fr-container">Utilisateurs</h1>

        <DataTable
          table={table}
          classNames={{ content: 'fr-container' }}
          placeholder={isLoading ? 'Chargement...' : 'Aucun utilisateur ne correspond aux filtres fournis'}
          caption="Liste des utilisateurs"
        />
      </div>
    </div>
  );
}
