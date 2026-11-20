import { ObservationsCard } from '@/features/observations/components/ObservationsCard';
import { useSummary } from '@/features/summary/context/SummaryContext';

export function SummaryObservationsCard() {
  const { nominationFileId, sessionId, summary } = useSummary();

  return (
    <ObservationsCard
      magistratName={summary.name ?? ''}
      nominationFileId={nominationFileId}
      observers={summary.observers}
      sessionId={sessionId}
    />
  );
}
