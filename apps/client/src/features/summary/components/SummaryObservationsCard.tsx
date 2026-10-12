import { useIsSg } from '@/features/auth/hooks/roles.hook';
import { Observations } from '@/features/observations/components/observations-section/Observations';
import { ObservationsModalProvider } from '@/features/observations/context/ObservationsModalProvider';
import { useSummary } from '@/features/summary/context/SummaryContext';
import { DetailsCard } from '@/shared/ui/details';
import { useObservationsQuery } from '@queries/observations.queries';

export function SummaryObservationsCard() {
  const isSg = useIsSg();
  const { nominationFileId, sessionId, summary } = useSummary();

  const { data } = useObservationsQuery({ nominationFileId, sessionId });

  if (summary.observers.length === 0 && !data?.observations.length) return null;

  return (
    <DetailsCard>
      <ObservationsModalProvider>
        <Observations
          context={isSg ? 'sg' : 'membre'}
          headingLevel={2}
          magistratName={summary.name ?? ''}
          nominationFileId={nominationFileId}
          observers={summary.observers}
          readOnly
          sessionId={sessionId}
        />
      </ObservationsModalProvider>
    </DetailsCard>
  );
}
