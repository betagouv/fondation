import Button from '@codegouvfr/react-dsfr/Button';
import { createColumnHelper } from '@tanstack/react-table';
import { generatePath } from 'react-router';

import type { PaginatedAdminUserListItemDto } from '@api/types';
import { useAdminUsersQuery } from '@queries/administration.queries';

import { Breadcrumb } from '@/components/shared/Breadcrumb';
import { DataTable, useDataTable, useQueryDataTableState } from '@/components/shared/data-table';
import { RoleEnumLabels, type RoleEnum } from '@/types/enums.types';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { capitalize } from '@/utils/string.utils';
import { UserTitleEnumLabels } from './admin-user-enum';

type AdminUserItem = PaginatedAdminUserListItemDto['items'][number];
const h = createColumnHelper<AdminUserItem>();

const columns = [
  h.accessor('lastName', {
    id: 'lastName',
    enableSorting: true,
    enableHiding: false,
    header: 'Nom',
    sortDescFirst: true,
    cell: ({ cell }) => <div className="uppercase">{cell.getValue()}</div>
  }),

  h.accessor('firstName', {
    id: 'firstName',
    enableSorting: false,
    enableHiding: false,
    header: 'Prénom',
    cell: ({ cell }) => <div className="capitalize">{cell.getValue()}</div>
  }),

  h.accessor('email', {
    id: 'email',
    enableSorting: false,
    header: 'Email'
  }),

  h.accessor('role', {
    id: 'role',
    enableSorting: false,
    header: 'Rôle',
    cell: ({ cell }) => RoleEnumLabels[cell.getValue()],
    meta: {
      filters: {
        type: 'enum',
        filterId: 'role',
        label: 'Rôle',
        values: Object.entries(RoleEnumLabels).map(([id, label]) => ({ id, label }))
      }
    }
  }),

  h.accessor('title', {
    id: 'title',
    enableSorting: false,
    header: 'Titre',
    cell: ({ cell }) => {
      const value = cell.getValue();
      return value ? UserTitleEnumLabels[value] : '-';
    }
  }),

  h.display({
    id: 'edit',
    enableSorting: false,
    enableHiding: false,
    cell: ({ row }) => <EditButton row={row.original} />
  })
];

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
    columnFilters: [] as { id: 'role'; value: RoleEnum[] }[],
    sorting: [] as [],
    globalFilter: ''
  });

  const { data, isLoading } = useAdminUsersQuery({
    search: tableState.globalFilter ?? '',
    pagination: tableState.pagination,
    sorting: tableState.sorting,
    roles: tableState.columnFilters.find(({ id }) => id === 'role')?.value
  });

  const table = useDataTable({
    columns,
    data: data?.items,
    getRowId: (row) => row.id,
    rowCount: data?.totalCount,
    meta: { paginationItemLabel: { one: 'utilisateur', other: 'utilisateurs' } },
    state: tableState,
    onStateChange: setTableState,
    enableGlobalFilter: true
  });

  return (
    <div className="fr-container flex flex-col justify-center pt-10">
      <Breadcrumb
        id="administration-breadcrumb"
        ariaLabel="Fil d'Ariane pour l'Administration"
        breadcrumb={{
          currentPageLabel: 'Utilisateurs',
          segments: [{ label: 'Administration', to: {} }]
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
