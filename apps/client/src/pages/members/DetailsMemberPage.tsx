import { FormattedMessage } from 'react-intl';
import { Navigate, useParams } from 'react-router';

import { DetailsMember } from '@/features/members/components/DetailsMember';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { useDetailedMember } from '@queries/members.queries';

export function DetailsMemberPage() {
  const { userId } = useParams();
  const { data: member, isLoading, isError } = useDetailedMember({ userId });

  if (isLoading) {
    return (
      <div className="fr-container fr-py-8v">
        <p>
          <FormattedMessage defaultMessage="Chargement..." />
        </p>
      </div>
    );
  }

  if (!userId || isError || !member) {
    return <Navigate replace to={ROUTE_PATHS.SG.MANAGE_MEMBERS} />;
  }

  return <DetailsMember member={member} />;
}
