import Button from '@codegouvfr/react-dsfr/Button';
import Input from '@codegouvfr/react-dsfr/Input';
import { createModal } from '@codegouvfr/react-dsfr/Modal';
import { useIsModalOpen } from '@codegouvfr/react-dsfr/Modal/useIsModalOpen';
import { createContext, useCallback, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { useUpdateNominationFileMissingEvaluationCommentMutation } from '@queries/members.queries';

export const MISSING_EVALUATION_COMMENT_MAX_LENGTH = 150;

const modal = createModal({ id: 'missing-evaluation-comment', isOpenedByDefault: false });

type EditedComment = { comment: string | null; magistrat: string; nominationFileId: string };

const EditMissingEvaluationCommentContext = createContext<(edited: EditedComment) => void>(() => {});

export function MissingEvaluationCommentProvider(props: PropsWithChildren<{ sessionId: string }>) {
  const [edited, setEdited] = useState<EditedComment | null>(null);

  const edit = useCallback((next: EditedComment) => {
    setEdited(next);
    modal.open();
  }, []);

  return (
    <EditMissingEvaluationCommentContext value={edit}>
      {props.children}

      <MissingEvaluationCommentModal edited={edited} sessionId={props.sessionId} />
    </EditMissingEvaluationCommentContext>
  );
}

function MissingEvaluationCommentModal(props: { edited: EditedComment | null; sessionId: string }) {
  const { formatMessage } = useIntl();
  const { mutate, isPending, isError } = useUpdateNominationFileMissingEvaluationCommentMutation();
  const [comment, setComment] = useState('');

  const isOpen = useIsModalOpen(modal);

  useEffect(() => {
    if (isOpen) setComment(props.edited?.comment ?? '');
  }, [isOpen, props.edited]);

  const isUnchanged = (comment.trim() || null) === (props.edited?.comment ?? null);

  const onSave = useCallback(() => {
    if (!props.edited) return;

    mutate(
      {
        comment: comment.trim() || null,
        nominationFileId: props.edited.nominationFileId,
        sessionId: props.sessionId,
      },
      { onSuccess: () => modal.close() },
    );
  }, [comment, mutate, props.edited, props.sessionId]);

  return (
    <modal.Component
      buttons={[
        { children: <FormattedMessage defaultMessage="Annuler" />, priority: 'secondary' },
        {
          children: <FormattedMessage defaultMessage="Enregistrer" />,
          disabled: isPending || isUnchanged,
          doClosesModal: false,
          onClick: onSave,
          priority: 'primary',
        },
      ]}
      title={<FormattedMessage defaultMessage="Commentaire" />}
      topAnchor
    >
      <form>
        <Input
          hintText={formatMessage(
            { defaultMessage: '{count} caractères maximum' },
            { count: MISSING_EVALUATION_COMMENT_MAX_LENGTH },
          )}
          label={formatMessage(
            { defaultMessage: 'Suivi de l’évaluation manquante de {magistrat}' },
            { magistrat: props.edited?.magistrat ?? '' },
          )}
          nativeTextAreaProps={{
            maxLength: MISSING_EVALUATION_COMMENT_MAX_LENGTH,
            onChange: (event) => setComment(event.target.value),
            rows: 3,
            value: comment,
          }}
          textArea
        />

        {isError && (
          <p className="fr-error-text fr-mt-0" role="alert">
            <FormattedMessage defaultMessage="L'enregistrement a échoué" />
          </p>
        )}
      </form>
    </modal.Component>
  );
}

export function MissingEvaluationCommentCell(props: {
  comment: string | null;
  disabled: boolean;
  magistrat: string;
  nominationFileId: string;
}) {
  const edit = useContext(EditMissingEvaluationCommentContext);

  if (props.disabled) {
    return props.comment ? <span className="text-sm">{props.comment}</span> : null;
  }

  return (
    <Button
      className="fr-btn--align-on-content text-left whitespace-normal"
      onClick={() =>
        edit({
          comment: props.comment,
          magistrat: props.magistrat,
          nominationFileId: props.nominationFileId,
        })
      }
      priority="tertiary no outline"
      size="small"
    >
      {props.comment ?? <FormattedMessage defaultMessage="Ajouter" />}
    </Button>
  );
}
