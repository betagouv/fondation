import Input from '@codegouvfr/react-dsfr/Input';
import { useId } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import type { SessionCommentDraft } from '@/features/transparence/hooks/useSessionCommentDraft';
import { CommentLastChange } from '@/shared/components/comment-last-change';

export function SessionCommentField(props: {
  draft: SessionCommentDraft;
  isArchived: boolean;
  rows: number;
}) {
  const { formatMessage } = useIntl();
  const hintId = useId();
  const { lastChange } = props.draft;

  return (
    <>
      <div className="flex items-baseline justify-between gap-4">
        <p className="fr-hint-text fr-mb-0" id={hintId}>
          <FormattedMessage defaultMessage="Ce commentaire apparaîtra dans la notice de restitution" />
        </p>
        {lastChange && <CommentLastChange {...lastChange} />}
      </div>
      <Input
        classes={{ nativeInputOrTextArea: 'fr-mt-3v' }}
        className="fr-mb-0"
        disabled={props.isArchived}
        label={
          <span className="fr-sr-only">{formatMessage({ defaultMessage: 'Commentaire de la notice' })}</span>
        }
        nativeTextAreaProps={{
          'aria-describedby': hintId,
          onChange: (e) => props.draft.onChange(e.target.value),
          rows: props.rows,
          value: props.draft.value,
        }}
        state={props.draft.isError || props.draft.isWarned ? 'error' : 'default'}
        stateRelatedMessage={
          props.draft.isError
            ? formatMessage({
                defaultMessage:
                  "L'enregistrement a échoué, réessayez et prévenez le support si cela persiste.",
              })
            : formatMessage({
                defaultMessage: 'Modifications non enregistrées. Cliquez sur Enregistrer pour les garder.',
              })
        }
        textArea
      />
    </>
  );
}
