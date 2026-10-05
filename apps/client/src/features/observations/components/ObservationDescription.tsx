import { FormattedMessage, useIntl } from 'react-intl';

import { useIsSg } from '@/features/auth/hooks/roles.hook';
import { CommentEditor } from '@/shared/ui/comment-editor';
import { dateOnlyToIso } from '@/utils/date-only.util';
import type { GetObservationDetailsResponseDto } from '@api/types';
import { useUpdateObservationMutation } from '@queries/observations.queries';

export function ObservationDescription(props: {
  isArchived: boolean;
  nominationFileId: string;
  observation: GetObservationDetailsResponseDto;
  sessionId: string;
}) {
  const { formatMessage } = useIntl();
  const isSg = useIsSg();
  const { mutateAsync } = useUpdateObservationMutation();

  return (
    <>
      <h2 className="fr-h4">
        <FormattedMessage defaultMessage="Complément SG" />
      </h2>
      {isSg && (
        <p className="fr-mb-4v text-sm text-(--text-mention-grey)">
          <FormattedMessage defaultMessage="Ce commentaire est visible par les membres" />
        </p>
      )}
      <CommentEditor
        ariaLabel={formatMessage({ defaultMessage: 'Complément SG' })}
        emptyLabel={<FormattedMessage defaultMessage="Aucun commentaire" />}
        initialValue={props.observation.description || null}
        onSave={(description) =>
          mutateAsync({
            dateReception: dateOnlyToIso(props.observation.receptionDate),
            description,
            linkedObservationsAttachments: [],
            magistratId: props.observation.observant.id,
            nominationFileId: props.nominationFileId,
            observationId: props.observation.id,
            sessionId: props.sessionId,
          })
        }
        placeholder={formatMessage({ defaultMessage: 'Saisissez un commentaire…' })}
        readOnly={!isSg || props.isArchived}
      />
    </>
  );
}
