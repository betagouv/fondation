import './MemberList.css';

import Button from '@codegouvfr/react-dsfr/Button';
import Table from '@codegouvfr/react-dsfr/Table';

import { useServerPagination } from '@/hooks/useServerPagination.hook';
import { useMemberListQuery } from '@queries/members.queries';

import { RoleEnumLabels } from '@/types/enums.types';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { capitalize } from '@/utils/string.utils';
import { TableControl } from '../../../shared/TableControl';
import { MemberListStatCell } from './MemberListStateCell';

const CURRENT_YEAR = new Date().getFullYear();

export function MemberList() {
  const { page, limit, setPage, setLimit } = useServerPagination({ defaultLimit: 50 });

  const { data, isLoading } = useMemberListQuery({ page, limit });

  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="flex flex-col justify-center gap-4">
      <div className="flex flex-col gap-4 lg:mx-auto lg:w-[80%]">
        <Table
          bordered
          id="members-list"
          headers={['Formation', 'Nom de famille', 'Prénom', `Stats ${CURRENT_YEAR}`, '']}
          data={
            data?.items.map((member) => [
              <div>{RoleEnumLabels[member.role]}</div>,
              <div className="uppercase">{member.lastName}</div>,
              <div className="capitalize">{member.firstName}</div>,
              <MemberListStatCell stats={member.stats} />,
              <Button
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
        currentPage={page}
        itemsPerPage={limit}
        displayedItems={data?.items.length ?? 0}
        totalItems={totalCount}
        totalPages={totalPages}
        onChange={setLimit}
        setCurrentPage={setPage}
      />
    </div>
  );
}
