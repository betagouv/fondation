import './MemberList.css';

import Table from '@codegouvfr/react-dsfr/Table';
import { RoleLabels } from 'shared-models';
import { useMemberListQuery } from '../members.queries';
import Button from '@codegouvfr/react-dsfr/Button';
import { TableControl } from '../../../shared/TableControl';
import { ROUTE_PATHS } from '../../../../utils/route-path.utils';
import { capitalize } from '../../../../utils/string.utils';

export function MemberList() {
  const { data, isLoading } = useMemberListQuery();

  if (isLoading) return <p>Chargement...</p>;

  return (
    <div className="flex flex-col justify-center gap-4">
      <Table
        bordered
        id="members-list"
        style={{ margin: '0 auto', width: '80%' }}
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

      <TableControl
        currentPage={1}
        itemsPerPage={20}
        displayedItems={data?.items.length ?? 0}
        totalItems={data?.totalCount ?? 0}
        setCurrentPage={() => {}}
        onChange={() => {}}
        totalPages={Math.ceil((data?.totalCount ?? 0) / 20)}
      />
    </div>
  );
}
