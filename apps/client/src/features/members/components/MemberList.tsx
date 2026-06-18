import Button from '@codegouvfr/react-dsfr/Button';
import { createColumnHelper } from '@tanstack/react-table';
import { defineMessage } from 'react-intl';

import { DataTable, useDataTable, useQueryDataTableState } from '@/components/shared/data-table';
import { RoleEnumLabels } from '@/types/enums.types';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { capitalize } from '@/utils/string.utils';
import type { PaginatedMemberListItemDto } from '@api/types';
import { useMemberListQuery } from '@queries/members.queries';

import { MemberListStatCell } from './MemberListStateCell';

const h = createColumnHelper<PaginatedMemberListItemDto['items'][number]>();
const columns = [
  h.accessor('role', {
    id: 'formation',
    enableSorting: false,
    header: 'Formation',
    cell: ({ cell }) => RoleEnumLabels[cell.getValue()],
    meta: {
      filters: {
        type: 'enum',
        filterId: 'formation',
        label: 'Formation',
        values: [
          { id: 'COMMUN', label: 'Commun' },
          { id: 'PARQUET', label: 'Parquet' },
          { id: 'SIEGE', label: 'Siège' },
        ],
      },
    },
  }),

  h.accessor('lastName', {
    id: 'lastName',
    enableSorting: true,
    enableHiding: false,
    header: 'Nom de famille',
    cell: ({ cell }) => <div className="uppercase">{cell.getValue()}</div>,
  }),

  h.accessor('firstName', {
    id: 'firstName',
    enableSorting: true,
    enableHiding: false,
    header: 'Prénom',
    cell: ({ cell }) => <div className="capitalize">{cell.getValue()}</div>,
  }),

  h.accessor('stats', {
    id: 'stats',
    enableSorting: false,
    header: () => {
      const currentYear = new Date().getFullYear();
      return `Stats ${currentYear}`;
    },
    cell: ({ cell }) => <MemberListStatCell stats={cell.getValue()} />,
  }),

  h.display({
    id: 'edit',
    enableSorting: false,
    enableHiding: false,
    cell: ({ row }) => (
      <Button
        priority="tertiary no outline"
        className="rounded-full"
        iconId="fr-icon-edit-fill"
        title={`Éditer ${capitalize(row.original.firstName)} ${row.original.lastName.toUpperCase()}`}
        linkProps={{ to: ROUTE_PATHS.SG.MANAGE_SINGLE_MEMBER.replace(':userId', row.original.id) }}
      />
    ),
  }),
];

export function MemberList() {
  const [tableState, setTableState] = useQueryDataTableState({
    pagination: { pageIndex: 0, pageSize: 50 },
    columnFilters: [] as { id: 'formation'; value: ('COMMUN' | 'PARQUET' | 'SIEGE')[] }[],
    sorting: [] as [{ id: 'lastName' | 'firstName'; desc: boolean }] | [],
    globalFilter: '',
  });

  const formations = (tableState.columnFilters ?? []).find(({ id }) => id === 'formation')?.value;

  const { data, isLoading } = useMemberListQuery({
    formations,
    sorting: tableState.sorting,
    pagination: tableState.pagination,
    search: tableState.globalFilter ?? '',
  });

  const table = useDataTable({
    columns,
    data: data?.items,
    getRowId: (row) => row.id,
    rowCount: data?.totalCount,
    meta: {
      paginationItemLabel: defineMessage({
        defaultMessage: '{count, plural, one {membre} other {membres}}',
      }),
    },
    state: tableState,
    onStateChange: setTableState,

    enableGlobalFilter: true,
  });

  return (
    <div className="flex flex-col justify-center gap-4">
      <div className="flex flex-col gap-4 lg:mx-auto lg:w-[80%]">
        <h1 className="fr-container">Membres</h1>

        <DataTable
          table={table}
          classNames={{ content: 'fr-container' }}
          placeholder={isLoading ? 'Chargement...' : 'Aucune données ne correspond aux filtres fournis'}
          caption={'Liste des membres'}
        />
      </div>
    </div>
  );
}
