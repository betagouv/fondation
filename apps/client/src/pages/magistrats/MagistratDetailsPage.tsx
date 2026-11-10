import { FormattedMessage } from 'react-intl';
import { useParams } from 'react-router';

import { useIsSgNavigation } from '@/features/auth/hooks/roles.hook';
import { MagistratDetailsContent } from '@/features/magistrats/components/MagistratDetailsContent';
import { MagistratNotFound } from '@/features/magistrats/components/MagistratNotFound';
import { useScrollToTop } from '@/shared/hooks/useScrollToTop';
import { PageContentLayout } from '@/shared/ui/PageContentLayout';
import { HttpException } from '@/utils/http-exception';
import { useMagistratDetailsQuery } from '@queries/magistrats.queries';

export function MagistratDetailsPage() {
  const { magistratId } = useParams<{ magistratId: string }>();

  const isSgContext = useIsSgNavigation();
  const context = isSgContext ? 'sg' : 'membre';

  const { data: magistrat, error, isLoading } = useMagistratDetailsQuery({ magistratId });

  useScrollToTop(magistratId);

  if (isLoading) {
    return (
      <PageContentLayout>
        <p>
          <FormattedMessage defaultMessage="Chargement..." />
        </p>
      </PageContentLayout>
    );
  }

  const isNotFound = error instanceof HttpException && error.statusCode === 404;
  // a failed reload keeps the data loaded before: the page stays rather than the error page
  if (error && !isNotFound && !magistrat) throw error;
  if (!magistrat) return <MagistratNotFound context={context} />;

  return <MagistratDetailsContent context={context} magistrat={magistrat} />;
}
