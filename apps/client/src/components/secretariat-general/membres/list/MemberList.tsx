import './MemberList.css';

import Table from '@codegouvfr/react-dsfr/Table';
import { RoleLabels } from 'shared-models';
import { useMemberListQuery } from '../members.queries';
import Button from '@codegouvfr/react-dsfr/Button';
import { TableControl } from '../../../shared/TableControl';
import { ROUTE_PATHS } from '../../../../utils/route-path.utils';
import { capitalize } from '../../../../utils/string.utils';
import { useState } from 'react';

export function MemberList() {
  const [pagination, setPagination] = useState<{ limit: number; page: number }>({ page: 1, limit: 25 });
  const { data, isLoading } = useMemberListQuery(pagination);

  return (
    <div className="flex flex-col justify-center gap-4">
      <div className="flex flex-col gap-4 lg:mx-auto lg:w-[80%]">
        <Table
          bordered
          id="members-list"
          headers={['Formation', 'Nom de famille', 'Prénom', '']}
          data={
            data?.items.map((member) => [
              <div>{RoleLabels[member.role]}</div>,
              <div className="uppercase">{member.lastName}</div>,
              <div className="capitalize">{member.firstName}</div>,
              <Button
                priority="tertiary no outline"
                iconId="fr-icon-edit-line"
                title={`Éditer ${capitalize(member.firstName)} ${member.lastName.toUpperCase()}`}
                linkProps={{ href: ROUTE_PATHS.SG.MANAGE_SINGLE_MEMBER.replace(':userId', member.id) }}
              />
            ]) ?? []
          }
        />

        {isLoading ? <p>Chargement...</p> : null}
      </div>

      <TableControl
        label={{ one: 'membre', other: 'membres' }}
        currentPage={data?.currentPageIndex ?? 1}
        itemsPerPage={pagination.limit}
        displayedItems={data?.items.length ?? 0}
        totalItems={data?.totalCount ?? 0}
        totalPages={data ? Math.ceil(data.totalCount / pagination.limit) : 1}
        onChange={(limit) => {
          setPagination({ limit, page: 1 });
        }}
        setCurrentPage={(page: number) => {
          setPagination((p) => ({ ...p, page }));
        }}
      />
    </div>
  );
}
