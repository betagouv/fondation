import './MemberList.css';

import Button from '@codegouvfr/react-dsfr/Button';
import Table from '@codegouvfr/react-dsfr/Table';
import type { ReactNode } from 'react';
import { RoleLabels } from 'shared-models';
import { useServerPagination } from '../../../../hooks/useServerPagination.hook';
import { ROUTE_PATHS } from '../../../../utils/route-path.utils';
import { capitalize } from '../../../../utils/string.utils';
import { SortButton } from '../../../shared/SortButton';
import { TableControl } from '../../../shared/TableControl';
import { useMemberListQuery, type MemberSortField } from '../members.queries';

type HeaderColumn = {
  field: string;
  label: string;
  sortKey?: MemberSortField;
};

const HEADERS_COLUMNS: HeaderColumn[] = [
  { field: 'role', label: 'Formation', sortKey: 'role' },
  { field: 'lastName', label: 'Nom de famille', sortKey: 'lastName' },
  { field: 'firstName', label: 'Prénom', sortKey: 'firstName' },
  { field: 'actions', label: '' }
];

export function MemberList() {
  const { page, limit, sortField, sortDirection, setPage, setLimit, setSort, getPageUrl, getSortIcon } =
    useServerPagination({ defaultLimit: 25 });

  const { data, isLoading } = useMemberListQuery({
    page,
    limit,
    sortField: sortField as MemberSortField | null,
    sortDirection
  });

  const totalItems = data?.totalCount ?? 0;
  const totalPages = Math.ceil(totalItems / limit);
  const displayedItems = data?.items.length ?? 0;
  const currentPage = data?.currentPageIndex ?? 1;

  const headers: ReactNode[] = HEADERS_COLUMNS.map((header) => (
    <span key={header.field} className="flex items-center gap-1">
      {header.label}
      {header.sortKey && (
        <SortButton
          iconId={getSortIcon(header.sortKey)}
          onClick={() => setSort(header.sortKey!)}
          label={header.label}
        />
      )}
    </span>
  ));

  return (
    <div className="flex flex-col justify-center gap-4">
      <div className="flex flex-col gap-4 lg:mx-auto lg:w-[80%]">
        <Table
          bordered
          id="members-list"
          headers={headers}
          data={
            data?.items.map((member) => [
              <div key={`role-${member.id}`}>{RoleLabels[member.role]}</div>,
              <div key={`lastName-${member.id}`} className="uppercase">{member.lastName}</div>,
              <div key={`firstName-${member.id}`} className="capitalize">{member.firstName}</div>,
              <Button
                key={`edit-${member.id}`}
                priority="tertiary no outline"
                iconId="fr-icon-edit-line"
                title={`Éditer ${capitalize(member.firstName)} ${member.lastName.toUpperCase()}`}
                linkProps={{ to: ROUTE_PATHS.SG.MANAGE_SINGLE_MEMBER.replace(':userId', member.id) }}
              />
            ]) ?? []
          }
        />

        {isLoading ? <p>Chargement...</p> : null}
      </div>

      <TableControl
        label={{ one: 'membre', other: 'membres' }}
        currentPage={currentPage}
        itemsPerPage={limit}
        displayedItems={displayedItems}
        totalItems={totalItems}
        totalPages={totalPages}
        onChange={setLimit}
        setCurrentPage={setPage}
        getPageUrl={getPageUrl}
      />
    </div>
  );
}
