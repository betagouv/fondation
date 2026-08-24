import Button from '@codegouvfr/react-dsfr/Button';
import Input from '@codegouvfr/react-dsfr/Input';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { useNominationFilesTable } from '@/features/nomination-files-table/context/files-table.context';
import { Modal } from '@/shared/ui/modal';
import { RequiredLabel } from '@/shared/ui/required-label';
import type { NominationFileOutcomeEnum } from '@/types/enums.types';

import { outcomeRequiresComment, sessionOutcomeLabel } from './nomination-file-outcome.utils';

export function NominationFileOutcomeCommentModal(props: {
  initialComment: string | null;
  onClosed: () => void;
  onComment: (comment: string | null) => void;
  onDrop: () => void;
  open: boolean;
  outcome: NominationFileOutcomeEnum;
}) {
  const { formatMessage } = useIntl();
  const { outcomes } = useNominationFilesTable();

  const [comment, setComment] = useState(props.initialComment);

  const isCommentRequired = outcomeRequiresComment(outcomes, props.outcome);
  const isCommentValid = (comment?.trim().length ?? 0) > 0;
  const isUnchanged = (comment?.trim() || null) === props.initialComment;
  const hint = formatMessage(
    { defaultMessage: `L'issue "{label}" nécessite un commentaire` },
    { label: sessionOutcomeLabel(outcomes, props.outcome) ?? '' },
  );
  const label = <FormattedMessage defaultMessage="Commentaire concernant l'issue de ce dossier" />;

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
            disabled={isUnchanged || (isCommentRequired && !isCommentValid)}
            onClick={() => props.onComment(comment?.trim() || null)}
            title={isCommentRequired && !isCommentValid ? hint : undefined}
          >
            <FormattedMessage defaultMessage="Sauvegarder" />
          </Button>
        </>
      }
      closeOnBackdrop={!isCommentRequired}
      onClose={props.onDrop}
      onClosed={props.onClosed}
      open={props.open}
      title={<FormattedMessage defaultMessage="Commentaire" />}
    >
      <Input
        hintText={isCommentRequired ? hint : null}
        label={isCommentRequired ? <RequiredLabel>{label}</RequiredLabel> : label}
        nativeTextAreaProps={{
          onChange: (event) => setComment(event.target.value || null),
          required: isCommentRequired,
          rows: 3,
          value: comment ?? '',
        }}
        textArea
      />
    </Modal>
  );
}
