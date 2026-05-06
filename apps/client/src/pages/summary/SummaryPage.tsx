import { useParams } from 'react-router';

import { AuthGuard } from '@/components/guards/AuthGuard';
import { SummaryContainer } from '@/components/summary/components/SummaryContainer';
import { Summary } from '@/components/summary/Summary';
import { useVisibleSummarySections } from '@/components/summary/useVisibleSummarySections';
import { AUTHORIZED_ROLES } from '@/constants/authorized-roles.constants';
import { HttpException } from '@/utils/http-exception';
import { useUser } from '@queries/auth.queries';
import { useSummaryQuery } from '@queries/summary.queries';

import { SummaryContext } from './SummaryContext';
import { SummaryNotFound } from './SummaryNotFound';

function SummaryPageInner() {
  const { user } = useUser();

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
    isFetched && !!user?.id && !!data && !!data.summary.author?.id && user.id === data.summary.author.id;

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
      {notFound ? (
        <SummaryNotFound />
      ) : (
        <SummaryContainer>
          <Summary />
        </SummaryContainer>
      )}
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
