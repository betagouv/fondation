import { FormattedMessage } from 'react-intl';

import { useIsSg } from '@/features/auth/hooks/roles.hook';
import { AuditionDateForm } from '@/features/nomination-files-table/components/cells/magistrat-side-panel/components/audition-date/AuditionDateForm';
import { DetailsCard } from '@/shared/ui/details';
import type { GetObservationDetailsResponseDto } from '@api/types';

// members read the date in the banner on top of the page: the card is the place where the SG schedules it
export function ObservationAuditionCard(props: {
  isArchived: boolean;
  nominationFileId: string;
  observation: GetObservationDetailsResponseDto;
  sessionId: string;
}) {
  const isSg = useIsSg();
  const { observant, relatedPropositions } = props.observation;
  const { audition } = observant;
  const editable = !props.isArchived && observant.auditionScheduling === 'SCHEDULABLE';
  const isShared = relatedPropositions.length > 0;

  if (!isSg) return null;

  return (
    <DetailsCard>
      {editable ? (
        <AuditionDateForm
          editable
          headingLevel="h2"
          initialAuditionDate={audition?.date ?? null}
          initialAuditionTime={audition?.time ?? null}
          isShared={isShared}
          sessionId={props.sessionId}
          target={{
            nominationFileId: props.nominationFileId,
            observationId: props.observation.id,
            type: 'OBSERVANT',
          }}
        />
      ) : (
        <>
          <h2 className="fr-h4">
            <FormattedMessage defaultMessage="Audition" />
          </h2>
          {!audition && (
            <p className="fr-mb-0 text-(--text-mention-grey)">
              <UnschedulableAuditionMessage
                isArchived={props.isArchived}
                scheduling={observant.auditionScheduling}
              />
            </p>
          )}
        </>
      )}
    </DetailsCard>
  );
}

function UnschedulableAuditionMessage(props: {
  isArchived: boolean;
  scheduling: GetObservationDetailsResponseDto['observant']['auditionScheduling'];
}) {
  if (props.isArchived) {
    return (
      <FormattedMessage defaultMessage="La session est archivée : aucune audition ne peut plus être programmée." />
    );
  }

  switch (props.scheduling) {
    case 'FINAL_OUTCOME':
      return (
        <FormattedMessage defaultMessage="Les dossiers observés ont une issue définitive : aucune audition ne peut plus être programmée." />
      );
    case 'LOCKED':
      return (
        <FormattedMessage defaultMessage="Les dossiers observés figurent déjà dans un document : aucune audition ne peut plus être programmée." />
      );
    case 'NOT_IN_PROGRESS':
      return (
        <FormattedMessage defaultMessage="Aucun dossier observé n'est encore en traitement : aucune audition ne peut plus être programmée." />
      );
    case 'SCHEDULABLE':
      return null;
  }
}
