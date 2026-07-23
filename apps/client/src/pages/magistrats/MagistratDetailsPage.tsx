import { FormattedMessage } from 'react-intl';
import { Navigate, useParams } from 'react-router';

import { useIsSgNavigation } from '@/features/auth/hooks/roles.hook';
import { MagistratDetails } from '@/features/magistrats/components/MagistratDetails';
import { PageContentLayout } from '@/shared/ui/PageContentLayout';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { useMagistratDetailsQuery } from '@queries/magistrats.queries';

export function MagistratDetailsPage() {
  const { magistratId } = useParams<{ magistratId: string }>();

  const isSgContext = useIsSgNavigation();
  const context = isSgContext ? 'sg' : 'membre';

  const { data: magistrat, isLoading, isError } = useMagistratDetailsQuery({ magistratId });

  if (isLoading) {
    return (
      <PageContentLayout>
        <p>
          <FormattedMessage defaultMessage="Chargement..." />
        </p>
      </PageContentLayout>
    );
  }

  const fallbackPath = isSgContext ? ROUTE_PATHS.SG.DASHBOARD : ROUTE_PATHS.TRANSPARENCES.DASHBOARD;

  if (!magistratId || isError || !magistrat) {
    return <Navigate replace={true} to={fallbackPath} />;
  }

  return <MagistratDetails context={context} magistrat={magistrat} />;
}
