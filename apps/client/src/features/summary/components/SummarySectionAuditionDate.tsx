import { FormattedMessage } from 'react-intl';

import { useIsSg } from '@/features/auth/hooks/roles.hook';
import { useSummary } from '@/features/summary/context/SummaryContext';

import { SummaryAuditionDate } from './SummaryAuditionDate';
import { SummarySectionCard } from './SummarySectionCard';

export function SummarySectionAuditionDate() {
  const { summary, sessionId, nominationFileId } = useSummary();
  const isSg = useIsSg();
  const editable = isSg && !summary.isArchived;

  if (!editable && !summary.auditionDate) return null;

  return (
    <SummarySectionCard id="audition">
      <h2>
        <FormattedMessage defaultMessage="Audition" />
      </h2>
      <SummaryAuditionDate
        editable={editable}
        initialAuditionDate={summary.auditionDate}
        nominationFileId={nominationFileId}
        sessionId={sessionId}
      />
    </SummarySectionCard>
  );
}
