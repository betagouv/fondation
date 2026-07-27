import { FormattedMessage } from 'react-intl';
import { Navigate, useParams } from 'react-router';

import { useIsSgNavigation } from '@/features/auth/hooks/roles.hook';
import { MagistratDetailsContent } from '@/features/magistrats/components/MagistratDetailsContent';
import { PageContentLayout } from '@/shared/ui/PageContentLayout';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import {
  useMagistratDetailsQuery,
  useMagistratNominationFilesQuery,
  useMagistratObservationsQuery,
} from '@queries/magistrats.queries';

export function MagistratDetailsPage() {
  const { magistratId } = useParams<{ magistratId: string }>();

  const isSgContext = useIsSgNavigation();
  const context = isSgContext ? 'sg' : 'membre';

  const { data: magistrat, isLoading, isError } = useMagistratDetailsQuery({ magistratId });
  const nominationFilesQuery = useMagistratNominationFilesQuery({ magistratId });
  const observationsQuery = useMagistratObservationsQuery({ magistratId });

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

  return (
    <MagistratDetailsContent
      context={context}
      magistrat={magistrat}
      nominationFiles={{
        hasMore: nominationFilesQuery.hasNextPage,
        isLoading: nominationFilesQuery.isLoading,
        isLoadingMore: nominationFilesQuery.isFetchingNextPage,
        items: nominationFilesQuery.data?.pages.flatMap((page) => page?.items ?? []) ?? [],
        onLoadMore: () => nominationFilesQuery.fetchNextPage(),
      }}
      observations={{
        hasMore: observationsQuery.hasNextPage,
        isLoading: observationsQuery.isLoading,
        isLoadingMore: observationsQuery.isFetchingNextPage,
        items: observationsQuery.data?.pages.flatMap((page) => page?.items ?? []) ?? [],
        onLoadMore: () => observationsQuery.fetchNextPage(),
      }}
    />
  );
}
