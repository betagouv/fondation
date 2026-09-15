import Button from '@codegouvfr/react-dsfr/Button';
import Input from '@codegouvfr/react-dsfr/Input';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { useNominationFilesTable } from '../context/files-table.context';
import type { NominationFileOutcomeEnum } from '@/shared/enums/nomination-file-outcome.enum';
import { Modal } from '@/shared/ui/modal';
import { RequiredLabel } from '@/shared/ui/required-label';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

import { sessionOutcomeLabel } from './cells/nomination-file-outcome/nomination-file-outcome.utils';

export type OutcomeComment = { comment: string | null; nominationFileId: string };

export function RequiredOutcomeCommentsModal(props: {
  files: readonly SessionNominationFile[];
  onClosed: () => void;
  onConfirm: (comments: readonly OutcomeComment[]) => void;
  onDrop: () => void;
  open: boolean;
  outcome: NominationFileOutcomeEnum;
}) {
  const { formatMessage } = useIntl();
  const { outcomes } = useNominationFilesTable();

  const [commentByFileId, setCommentByFileId] = useState<Record<string, string>>(() =>
    Object.fromEntries(props.files.map((file) => [file.id, file.content.outcome?.comment ?? ''])),
  );

  const hasEveryComment = props.files.every(({ id }) => (commentByFileId[id]?.trim().length ?? 0) > 0);
  const hint = formatMessage(
    { defaultMessage: `L'issue "{label}" nécessite un commentaire` },
    { label: sessionOutcomeLabel(outcomes, props.outcome) ?? '' },
  );

  const confirm = () =>
    props.onConfirm(
      props.files.map(({ id }) => ({ comment: commentByFileId[id]?.trim() || null, nominationFileId: id })),
    );

  return (
    <Modal
      actions={
        <>
          <Button onClick={props.onDrop} priority="secondary">
            <FormattedMessage defaultMessage="Annuler" />
          </Button>
          <Button disabled={!hasEveryComment} onClick={confirm} title={hasEveryComment ? undefined : hint}>
            <FormattedMessage defaultMessage="Sauvegarder" />
          </Button>
        </>
      }
      closeOnBackdrop={false}
      onClose={props.onDrop}
      onClosed={props.onClosed}
      open={props.open}
      title={
        <FormattedMessage
          defaultMessage={`{count, plural,
            one {Commentaire de la proposition}
            other {Commentaires des {count, number} propositions}}`}
          values={{ count: props.files.length }}
        />
      }
    >
      <p className="fr-mb-4v text-sm text-(--text-mention-grey)">{hint}</p>

      <div className="flex max-h-[50vh] flex-col gap-y-4 overflow-y-auto">
        {props.files.map((file) => (
          <Input
            key={file.id}
            label={<RequiredLabel>{file.content.nomMagistrat}</RequiredLabel>}
            nativeTextAreaProps={{
              onChange: (event) =>
                setCommentByFileId((current) => ({ ...current, [file.id]: event.target.value })),
              required: true,
              rows: 2,
              value: commentByFileId[file.id] ?? '',
            }}
            textArea
          />
        ))}
      </div>
    </Modal>
  );
}
