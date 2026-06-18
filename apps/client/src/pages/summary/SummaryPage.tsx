import { useParams } from 'react-router';

import { AuthGuard } from '@/features/auth/components/AuthGuard';
import { AUTHORIZED_ROLES } from '@/features/auth/constants/authorized-roles.constants';
import { useIsSg } from '@/features/auth/hooks/roles.hook';
import { Summary } from '@/features/summary/components/Summary';
import { SummaryContainer } from '@/features/summary/components/SummaryContainer';
import { SummaryNotFound } from '@/features/summary/components/SummaryNotFound';
import { SummaryContext } from '@/features/summary/context/SummaryContext';
import { useVisibleSummarySections } from '@/features/summary/hooks/useVisibleSummarySections';
import { ArchiveBannerPortal } from '@/shared/components/banners/archived-banner/ArchiveBannerPortal';
import { HttpException } from '@/utils/http-exception';
import { useUser } from '@queries/auth.queries';
import { useSummaryQuery } from '@queries/summary.queries';

function SummaryPageInner() {
  const { user } = useUser();
  const isSg = useIsSg();

  const params = useParams<{ sessionId: string; fileId: string }>();
  const sessionId = params.sessionId!;
  const nominationFileId = params.fileId!;

  const { sections, showSection } = useVisibleSummarySections();

  const { data, isLoading, error, isFetched } = useSummaryQuery({
    sessionId: sessionId!,
    nominationFileId: nominationFileId!,
  });

  if (isLoading) {
    return (
      <SummaryContainer>
        <p>Chargement...</p>
      </SummaryContainer>
    );
  }

  const canWriteSummary =
    isFetched && !!user?.id && !!data && (data.summary.author ? user.id === data.summary.author.id : isSg);

  const canReadSummary =
    isFetched &&
    !!user?.id &&
    !!data &&
    (canWriteSummary || data?.summary.readers.some(({ id }) => id === user.id));

  const notFound =
    isFetched &&
    (!data || !canReadSummary || (error && error instanceof HttpException && error.statusCode === 404));

  return (
    <SummaryContext
      value={{
        sections,
        showSection,
        sessionId,
        nominationFileId,
        canWriteSummary,
        summary: data ?? null,
      }}
    >
      <ArchiveBannerPortal isArchived={data?.isArchived}>
        {notFound ? (
          <SummaryNotFound />
        ) : (
          <SummaryContainer>
            <Summary />
          </SummaryContainer>
        )}
      </ArchiveBannerPortal>
    </SummaryContext>
  );
}

export function SummaryPage() {
  const { fileId: nominationFileId } = useParams();
  return (
    <AuthGuard authorizedRoles={AUTHORIZED_ROLES.ALL}>
      <SummaryPageInner key={nominationFileId} />
    </AuthGuard>
  );
}
