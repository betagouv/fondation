import { FormattedMessage } from 'react-intl';
import { useParams } from 'react-router';

import { useIsSg } from '@/features/auth/hooks/roles.hook';
import { SummaryDetailsContent } from '@/features/summary/components/SummaryDetailsContent';
import { SummaryNotFound } from '@/features/summary/components/SummaryNotFound';
import { SummaryContext } from '@/features/summary/context/SummaryContext';
import { ArchiveBannerPortal } from '@/shared/components/banners';
import { HttpException } from '@/utils/http-exception';
import { useUser } from '@queries/auth.queries';
import { useSummaryQuery } from '@queries/summary.queries';

function SummaryPageInner() {
  const { user } = useUser();
  const isSg = useIsSg();

  const params = useParams<{ fileId: string; sessionId: string }>();
  const sessionId = params.sessionId!;
  const nominationFileId = params.fileId!;

  const { data, error, isFetched, isLoading } = useSummaryQuery({
    nominationFileId: nominationFileId!,
    sessionId: sessionId!,
  });

  if (isLoading) {
    return (
      <div className="fr-container fr-py-6v">
        <p>
          <FormattedMessage defaultMessage="Chargement..." />
        </p>
      </div>
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
        canWriteSummary,
        nominationFileId,
        sessionId,
        summary: data ?? null,
      }}
    >
      <ArchiveBannerPortal isArchived={data?.isArchived}>
        {notFound ? <SummaryNotFound /> : <SummaryDetailsContent />}
      </ArchiveBannerPortal>
    </SummaryContext>
  );
}

export function SummaryPage() {
  const { fileId: nominationFileId } = useParams();
  return <SummaryPageInner key={nominationFileId} />;
}
