import { Navigate, useParams } from 'react-router-dom';
import { PageContentLayout } from '../../../components/shared/PageContentLayout';
import { ROUTE_PATHS } from '../../../utils/route-path.utils';
import { DetailsMember } from '../../../components/secretariat-general/membres/details/DetailsMember';
import { useDetailedMember } from '../../../components/secretariat-general/membres/members.queries';
import { DetailsMemberHeader } from '../../../components/secretariat-general/membres/details/DetailsMemberHeader';

export function DetailsUserPage() {
  const params = useParams();
  const userId = params.userId;

  const { data: user, isLoading, isError } = useDetailedMember({ userId });

  if (isLoading) return <p>Chargement...</p>;
  if (!userId || isError || !user) {
    return <Navigate replace={true} to={ROUTE_PATHS.SG.MANAGE_MEMBERS} />;
  }

  return (
    <PageContentLayout>
      <DetailsMemberHeader user={user} />
      <DetailsMember member={user} />
    </PageContentLayout>
  );
}
