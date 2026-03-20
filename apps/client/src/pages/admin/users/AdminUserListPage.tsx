import Button from '@codegouvfr/react-dsfr/Button';
import { createColumnHelper } from '@tanstack/react-table';
import { generatePath } from 'react-router';

import type { PaginatedAdminUserListItemDto } from '@api/types';
import { useAdminUsersQuery } from '@queries/administration.queries';

import { DataTable, useDataTable, useQueryDataTableState } from '@/components/shared/data-table';
import { RoleEnumLabels, type RoleEnum } from '@/types/enums.types';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { capitalize } from '@/utils/string.utils';

type AdminUserItem = PaginatedAdminUserListItemDto['items'][number];

const TITLE_LABELS: Record<string, string> = {
  PRESIDENT_SIEGE: 'Président Siège',
  PRESIDENT_PARQUET: 'Président Parquet',
  FIRST_SECRETARY: 'Premier Secrétaire'
};

const h = createColumnHelper<AdminUserItem>();

const columns = [
  h.accessor('lastName', {
    id: 'lastName',
    enableSorting: false,
    enableHiding: false,
    header: 'Nom',
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
        values: [
          { id: 'ADMIN', label: 'Administrateur' },
          { id: 'ADJOINT_SECRETAIRE_GENERAL', label: 'Secrétariat général' },
          { id: 'MEMBRE_COMMUN', label: 'Membre commun' },
          { id: 'MEMBRE_DU_PARQUET', label: 'Membre du parquet' },
          { id: 'MEMBRE_DU_SIEGE', label: 'Membre du siège' }
        ]
      }
    }
  }),

  h.accessor('title', {
    id: 'title',
    enableSorting: false,
    header: 'Titre',
    cell: ({ cell }) => {
      const value = cell.getValue();
      return value ? (TITLE_LABELS[value] ?? value) : '';
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
    page: (tableState.pagination?.pageIndex ?? 0) + 1,
    pageSize: tableState.pagination?.pageSize
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
    <div className="flex flex-col justify-center gap-4">
      <div className="flex flex-col gap-4 lg:mx-auto lg:w-[80%]">
        <h1 className="fr-container">Utilisateurs</h1>

        <DataTable
          table={table}
          classNames={{ content: 'fr-container' }}
          placeholder={
            isLoading ? 'Chargement...' : 'Aucun utilisateur ne correspond aux filtres fournis'
          }
          caption="Liste des utilisateurs"
        />
      </div>
    </div>
  );
}
