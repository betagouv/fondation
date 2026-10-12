import Button from '@codegouvfr/react-dsfr/Button';
import { createColumnHelper } from '@tanstack/react-table';
import React from 'react';
import { defineMessage, FormattedMessage, useIntl } from 'react-intl';
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
        cell: ({ cell }) => <div className="uppercase">{cell.getValue()}</div>,
        enableHiding: false,
        enableSorting: true,
        header: formatMessage({ defaultMessage: 'Nom' }),
        id: 'lastName',
        sortDescFirst: true,
      }),

      h.accessor('firstName', {
        cell: ({ cell }) => <div className="capitalize">{cell.getValue()}</div>,
        enableHiding: false,
        enableSorting: false,
        header: formatMessage({ defaultMessage: 'Prénom' }),
        id: 'firstName',
      }),

      h.accessor('email', {
        enableSorting: false,
        header: formatMessage({ defaultMessage: 'Email' }),
        id: 'email',
      }),

      h.accessor('role', {
        cell: ({ cell, row }) => <AdminUserRole gender={row.original.gender} value={cell.getValue()} />,
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
      }),

      h.display({
        cell: ({ row }) => <EditButton row={row.original} />,
        enableHiding: false,
        enableSorting: false,
        id: 'edit',
      }),
    ],
    [formatMessage],
  );
}

function EditButton(props: { row: AdminUserItem }) {
  const { formatMessage } = useIntl();

  return (
    <Button
      className="rounded-full"
      iconId="fr-icon-edit-fill"
      linkProps={{ to: generatePath(ROUTE_PATHS.ADMIN.USER_DETAIL, { userId: props.row.id }) }}
      priority="tertiary no outline"
      title={formatMessage(
        { defaultMessage: 'Éditer {firstName} {lastName}' },
        { firstName: capitalize(props.row.firstName), lastName: props.row.lastName.toUpperCase() },
      )}
    />
  );
}

export function AdminUserListPage() {
  const { formatMessage } = useIntl();
  const [tableState, setTableState] = useQueryDataTableState({
    columnFilters: [] as { id: 'role'; value: AdminUserRoleEnum[] }[],
    globalFilter: '',
    pagination: { pageIndex: 0, pageSize: 50 },
    sorting: [] as [],
  });

  const { data, isLoading } = useAdminUsersQuery({
    pagination: tableState.pagination,
    roles: tableState.columnFilters.find(({ id }) => id === 'role')?.value,
    search: tableState.globalFilter ?? '',
    sorting: tableState.sorting,
  });

  const columns = useAdminUserColumns();

  const table = useDataTable({
    columns,
    data: data?.items,
    enableGlobalFilter: true,
    getRowId: (row) => row.id,
    meta: {
      paginationItemLabel: defineMessage({
        defaultMessage: `{count, plural, one {utilisateur} other {utilisateurs}}`,
      }),
    },
    onStateChange: setTableState,
    rowCount: data?.totalCount,
    state: tableState,
  });

  return (
    <div className="fr-container fr-pt-8v flex flex-col justify-center">
      <Breadcrumb
        ariaLabel={formatMessage({ defaultMessage: "Fil d'Ariane pour l'Administration" })}
        breadcrumb={{
          currentPageLabel: formatMessage({ defaultMessage: 'Utilisateurs' }),
          segments: [{ label: formatMessage({ defaultMessage: 'Administration' }), to: {} }],
        }}
        id="administration-breadcrumb"
      />

      <div className="flex flex-col gap-4 lg:mx-auto lg:w-[80%]">
        <h1 className="fr-container">
          <FormattedMessage defaultMessage="Utilisateurs" />
        </h1>

        <DataTable
          caption={formatMessage({ defaultMessage: 'Liste des utilisateurs' })}
          classNames={{ content: 'fr-container' }}
          placeholder={
            isLoading
              ? formatMessage({ defaultMessage: 'Chargement...' })
              : formatMessage({ defaultMessage: 'Aucun utilisateur ne correspond aux filtres fournis' })
          }
          table={table}
        />
      </div>
    </div>
  );
}
