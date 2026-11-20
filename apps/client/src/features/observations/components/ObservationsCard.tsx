import { useIsSg } from '@/features/auth/hooks/roles.hook';
import { ObservationsModalProvider } from '@/features/observations/context/ObservationsModalProvider';
import { DetailsCard } from '@/shared/ui/details';
import { useObservationsQuery } from '@queries/observations.queries';

import { Observations } from './observations-section/Observations';

export function ObservationsCard({
  magistratName,
  nominationFileId,
  observers,
  sessionId,
}: {
  magistratName: string;
  nominationFileId: string;
  observers: string[] | null;
  sessionId: string;
}) {
  const isSg = useIsSg();
  const { data } = useObservationsQuery({ nominationFileId, sessionId });

  if (!observers?.length && !data?.observations.length) return null;

  return (
    <DetailsCard>
      <ObservationsModalProvider>
        <Observations
          context={isSg ? 'sg' : 'membre'}
          headingLevel={2}
          magistratName={magistratName}
          nominationFileId={nominationFileId}
          observers={observers}
          readOnly
          sessionId={sessionId}
        />
      </ObservationsModalProvider>
    </DetailsCard>
  );
}
