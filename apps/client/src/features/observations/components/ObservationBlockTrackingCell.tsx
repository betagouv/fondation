import Badge from '@codegouvfr/react-dsfr/Badge';
import Button from '@codegouvfr/react-dsfr/Button';
import Input from '@codegouvfr/react-dsfr/Input';
import RadioButtons from '@codegouvfr/react-dsfr/RadioButtons';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { GradeAndPosition } from '@/shared/components/GradeAndPosition';
import {
  OBSERVATION_BLOCK_TRACKING_STATUSES,
  ObservationBlockTrackingStatusEnumMessages,
} from '@/shared/enums/observation-block-tracking-status.enum';
import { IconButton } from '@/shared/ui/icon-button';
import { Modal } from '@/shared/ui/modal';
import { useToasts } from '@/shared/ui/toast';
import { Tooltip } from '@/shared/ui/tooltip';
import { formatDateOnly } from '@/utils/date-only.util';
import {
  type FollowedUpObservation,
  useUpdateObservationBlockTrackingMutation,
} from '@queries/observations.queries';

// the tracking belongs to the bloc d'observations: each row of the bloc shows it and edits it for the whole bloc
export function ObservationBlockTrackingCell(props: { row: FollowedUpObservation }) {
  const { formatMessage } = useIntl();
  const [isEditing, setIsEditing] = useState(false);
  const { laterPropositions, tracking } = props.row;

  return (
    <div className="flex flex-col items-start gap-1 leading-6">
      <div className="flex items-center gap-1">
        <Badge as="span" noIcon severity={tracking.status === 'DONE' ? 'success' : 'info'} small>
          {formatMessage(ObservationBlockTrackingStatusEnumMessages[tracking.status])}
        </Badge>
        {laterPropositions.length > 0 && (
          <Tooltip
            focusable
            label={
              <ul className="fr-m-0 fr-p-0 list-none">
                {laterPropositions.map((proposition) => (
                  <li key={proposition.id}>
                    {proposition.session.name} ({formatDateOnly(proposition.session.date)})
                    {proposition.number !== null && `, n° ${proposition.number}`} :{' '}
                    <GradeAndPosition
                      boldGrade={false}
                      grade={proposition.targeted.grade}
                      position={proposition.targeted.position}
                    />
                  </li>
                ))}
              </ul>
            }
          >
            <span
              aria-label={formatMessage(
                {
                  defaultMessage:
                    'Proposé sur {count, plural, one {# session ultérieure} other {# sessions ultérieures}}',
                },
                { count: laterPropositions.length },
              )}
              className="fr-icon-list-unordered fr-icon--sm"
              role="img"
            />
          </Tooltip>
        )}
        <IconButton
          iconId="fr-icon-edit-line"
          label={formatMessage({ defaultMessage: 'Modifier le suivi du bloc' })}
          onClick={() => setIsEditing(true)}
          small
        />
      </div>
      {tracking.comment && <p className="fr-mb-0 text-xs leading-6 italic">{tracking.comment}</p>}
      {isEditing && <ObservationBlockTrackingModal onClosed={() => setIsEditing(false)} row={props.row} />}
    </div>
  );
}

function ObservationBlockTrackingModal(props: { onClosed: () => void; row: FollowedUpObservation }) {
  const { formatMessage } = useIntl();
  const toasts = useToasts();
  const update = useUpdateObservationBlockTrackingMutation();
  const [open, setOpen] = useState(true);
  const [status, setStatus] = useState(props.row.tracking.status);
  const [comment, setComment] = useState(props.row.tracking.comment ?? '');
  const { observant } = props.row.observation;

  const save = () =>
    update.mutate(
      {
        comment: comment.trim() || null,
        magistratId: observant.id,
        sessionId: props.row.session.id,
        status,
      },
      {
        onError: () =>
          toasts.error({ title: formatMessage({ defaultMessage: "Le suivi n'a pas pu être enregistré" }) }),
        onSuccess: () => setOpen(false),
      },
    );

  return (
    <Modal
      actions={
        <>
          <Button onClick={() => setOpen(false)} priority="secondary">
            <FormattedMessage defaultMessage="Annuler" />
          </Button>
          <Button disabled={update.isPending} onClick={save}>
            <FormattedMessage defaultMessage="Enregistrer" />
          </Button>
        </>
      }
      onClose={() => setOpen(false)}
      onClosed={props.onClosed}
      open={open}
      title={
        <FormattedMessage
          defaultMessage="Suivi des observations de {observant} dans la session {session}"
          values={{ observant: observant.name, session: props.row.session.name }}
        />
      }
    >
      <RadioButtons
        legend={<FormattedMessage defaultMessage="Statut de suivi" />}
        name="observation-block-tracking-status"
        options={OBSERVATION_BLOCK_TRACKING_STATUSES.map((value) => ({
          label: formatMessage(ObservationBlockTrackingStatusEnumMessages[value]),
          nativeInputProps: {
            checked: status === value,
            onChange: () => setStatus(value),
          },
        }))}
        orientation="horizontal"
      />
      <Input
        hintText={
          <FormattedMessage defaultMessage="Facultatif. Il s'applique à toutes les observations du bloc." />
        }
        label={<FormattedMessage defaultMessage="Commentaire" />}
        nativeTextAreaProps={{
          maxLength: 2_000,
          onChange: (event) => setComment(event.target.value),
          rows: 3,
          value: comment,
        }}
        textArea
      />
    </Modal>
  );
}
