import { Navigate, useParams } from 'react-router-dom';

import { useDetailedMember } from '@queries/members.queries';

import { PageContentLayout } from '../../../components/shared/PageContentLayout';
import { ROUTE_PATHS } from '../../../utils/route-path.utils';
import { DetailsMember } from '../../../components/secretariat-general/membres/details/DetailsMember';
import { DetailsMemberHeader } from '../../../components/secretariat-general/membres/details/DetailsMemberHeader';

export function DetailsMemberPage() {
  const params = useParams();
  const userId = params.userId;

  const { data: member, isLoading, isError } = useDetailedMember({ userId });

  if (isLoading)
    return (
      <PageContentLayout>
        <p>Chargement...</p>
      </PageContentLayout>
    );

  if (!userId || isError || !member) {
    return <Navigate replace={true} to={ROUTE_PATHS.SG.MANAGE_MEMBERS} />;
  }

  return (
    <PageContentLayout>
      <DetailsMemberHeader member={member} />
      <DetailsMember member={member} />
    </PageContentLayout>
  );
}
