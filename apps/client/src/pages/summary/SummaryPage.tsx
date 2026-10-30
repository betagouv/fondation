import { FormattedMessage } from 'react-intl';
import { useParams } from 'react-router';

import { SummaryDetailsContent } from '@/features/summary/components/SummaryDetailsContent';
import { SummaryNotFound } from '@/features/summary/components/SummaryNotFound';
import { SummaryContext } from '@/features/summary/context/SummaryContext';
import { ArchiveBannerPortal } from '@/shared/components/banners';
import { useSummaryQuery } from '@queries/summary.queries';

function SummaryPageInner() {
  const params = useParams<{ fileId: string; sessionId: string }>();
  const sessionId = params.sessionId!;
  const nominationFileId = params.fileId!;

  const { data, isFetched, isLoading } = useSummaryQuery({
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

  const notFound = isFetched && !data;

  return (
    <SummaryContext
      value={{
        canWriteSummary: !!data?.summary.canWrite,
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
