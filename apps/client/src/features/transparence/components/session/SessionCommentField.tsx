import Input from '@codegouvfr/react-dsfr/Input';
import { useIntl } from 'react-intl';

import type { SessionCommentDraft } from '@/features/transparence/hooks/useSessionCommentDraft';

export function SessionCommentField(props: {
  draft: SessionCommentDraft;
  isArchived: boolean;
  rows: number;
}) {
  const { formatMessage } = useIntl();

  return (
    <Input
      className="fr-mb-0"
      disabled={props.isArchived}
      hintText={formatMessage({ defaultMessage: 'Cette note sera visible dans la notice de restitution' })}
      label={<span className="fr-sr-only">{formatMessage({ defaultMessage: 'Commentaire' })}</span>}
      nativeTextAreaProps={{
        className: 'fr-mt-3v',
        onChange: (e) => props.draft.onChange(e.target.value),
        rows: props.rows,
        value: props.draft.value,
      }}
      state={props.draft.isError || props.draft.isWarned ? 'error' : 'default'}
      stateRelatedMessage={
        props.draft.isError
          ? formatMessage({
              defaultMessage: "L'enregistrement a échoué, réessayez et prévenez le support si cela persiste.",
            })
          : formatMessage({
              defaultMessage:
                'Modifications non enregistrées. Cliquez sur Valider le commentaire pour les enregistrer.',
            })
      }
      textArea
    />
  );
}
