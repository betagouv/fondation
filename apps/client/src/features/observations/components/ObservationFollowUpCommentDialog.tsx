import Button from '@codegouvfr/react-dsfr/Button';
import Input from '@codegouvfr/react-dsfr/Input';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { Modal } from '@/shared/ui/modal';
import { RequiredLabel } from '@/shared/ui/required-label';
import type { ObservationFollowupEnum } from '@/types/enums.types';

export function ObservationFollowUpCommentModal(props: {
  followUp: ObservationFollowupEnum;
  onClosed: () => void;
  onComment: (value: string | null) => void;
  onDrop: () => void;
  open: boolean;
}) {
  const { formatMessage } = useIntl();
  const [comment, setComment] = useState<string | null>(null);

  const isCommentRequired = props.followUp === 'INTERESTING';
  const isCommentValid = Boolean(comment?.trim());
  const hint = formatMessage({ defaultMessage: 'Commentaire obligatoire' });
  const label = <FormattedMessage defaultMessage="Commentaire sur la suite donnée à cette observation" />;
  const isEmptied = isCommentRequired && comment !== null && !isCommentValid;

  return (
    <Modal
      actions={
        <>
          <Button
            disabled={isCommentRequired}
            onClick={() => props.onComment(null)}
            priority="secondary"
            title={isCommentRequired ? hint : undefined}
          >
            <FormattedMessage defaultMessage="Sans commentaire" />
          </Button>
          <Button
            disabled={isCommentRequired && !isCommentValid}
            onClick={() => props.onComment(comment?.trim() || null)}
            title={isCommentRequired && !isCommentValid ? hint : undefined}
          >
            <FormattedMessage defaultMessage="Sauvegarder" />
          </Button>
        </>
      }
      onClose={props.onDrop}
      onClosed={props.onClosed}
      open={props.open}
      title={<FormattedMessage defaultMessage="Commentaire" />}
    >
      <Input
        hintText={isEmptied ? <span className="text-(--text-default-error)">{hint}</span> : null}
        label={isCommentRequired ? <RequiredLabel>{label}</RequiredLabel> : label}
        nativeTextAreaProps={{
          name: 'observation_follow_up_comment',
          onChange: (event) => setComment(event.target.value),
          required: isCommentRequired,
          rows: 3,
          value: comment ?? '',
        }}
        textArea
      />
    </Modal>
  );
}
