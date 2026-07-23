import { useSummary } from '@/features/summary/context/SummaryContext';
import { BiographyList } from '@/shared/components/biography-list';

import { SummarySectionCard } from './SummarySectionCard';

export function SummarySectionBiography() {
  const { summary } = useSummary();

  return (
    <SummarySectionCard id={'biographie'}>
      <h2>Biographie</h2>

      {summary.biography ? (
        <BiographyList biography={summary.biography} />
      ) : (
        <span className="text-(--text-mention-grey)">N/A</span>
      )}
    </SummarySectionCard>
  );
}
