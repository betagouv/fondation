import Button from '@codegouvfr/react-dsfr/Button';
import Input from '@codegouvfr/react-dsfr/Input';
import { createContext, useCallback, useContext, useRef, useState, type PropsWithChildren } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { Modal } from '@/shared/ui/modal';
import { useUpdateNominationFileMissingEvaluationCommentMutation } from '@queries/members.queries';

export const MISSING_EVALUATION_COMMENT_MAX_LENGTH = 150;

type EditedComment = { comment: string | null; magistrat: string; nominationFileId: string };
type EditedCommentSession = { edited: EditedComment; id: number };

type EditState =
  | { session: EditedCommentSession; status: 'closing' }
  | { session: EditedCommentSession; status: 'editing' }
  | { status: 'idle' };

const EditMissingEvaluationCommentContext = createContext<((edited: EditedComment) => void) | null>(null);

export function MissingEvaluationCommentProvider(props: PropsWithChildren<{ sessionId: string }>) {
  const [state, setState] = useState<EditState>({ status: 'idle' });
  const lastSessionId = useRef(0);

  const edit = useCallback((edited: EditedComment) => {
    lastSessionId.current += 1;
    setState({ session: { edited, id: lastSessionId.current }, status: 'editing' });
  }, []);

  const close = useCallback(
    () =>
      setState((current) =>
        current.status === 'editing' ? { session: current.session, status: 'closing' } : current,
      ),
    [],
  );

  return (
    <EditMissingEvaluationCommentContext value={edit}>
      {props.children}

      {state.status !== 'idle' && (
        <MissingEvaluationCommentModal
          edited={state.session.edited}
          key={state.session.id}
          onClose={close}
          onClosed={() =>
            setState((current) => (current.status === 'closing' ? { status: 'idle' } : current))
          }
          open={state.status === 'editing'}
          sessionId={props.sessionId}
        />
      )}
    </EditMissingEvaluationCommentContext>
  );
}

function MissingEvaluationCommentModal(props: {
  edited: EditedComment;
  onClose: () => void;
  onClosed: () => void;
  open: boolean;
  sessionId: string;
}) {
  const { formatMessage } = useIntl();
  const { mutate, isPending, isError } = useUpdateNominationFileMissingEvaluationCommentMutation();
  const [comment, setComment] = useState(props.edited.comment ?? '');

  const isUnchanged = (comment.trim() || null) === props.edited.comment;

  const onSave = useCallback(() => {
    mutate(
      {
        comment: comment.trim() || null,
        nominationFileId: props.edited.nominationFileId,
        sessionId: props.sessionId,
      },
      { onSuccess: props.onClose },
    );
  }, [comment, mutate, props]);

  return (
    <Modal
      actions={
        <>
          {isError && (
            <p className="fr-error-text fr-mt-0 mr-auto" role="alert">
              <FormattedMessage defaultMessage="L'enregistrement a échoué" />
            </p>
          )}

          <Button disabled={isPending} onClick={props.onClose} priority="secondary">
            <FormattedMessage defaultMessage="Annuler" />
          </Button>
          <Button disabled={isPending || isUnchanged} onClick={onSave}>
            <FormattedMessage defaultMessage="Enregistrer" />
          </Button>
        </>
      }
      id="missing-evaluation-comment"
      onClose={props.onClose}
      onClosed={props.onClosed}
      open={props.open}
      title={<FormattedMessage defaultMessage="Commentaire" />}
    >
      <Input
        hintText={formatMessage(
          { defaultMessage: '{count} caractères maximum' },
          { count: MISSING_EVALUATION_COMMENT_MAX_LENGTH },
        )}
        label={formatMessage(
          { defaultMessage: 'Suivi de l’évaluation manquante de {magistrat}' },
          { magistrat: props.edited.magistrat },
        )}
        nativeTextAreaProps={{
          maxLength: MISSING_EVALUATION_COMMENT_MAX_LENGTH,
          onChange: (event) => setComment(event.target.value),
          rows: 3,
          value: comment,
        }}
        textArea
      />
    </Modal>
  );
}

export function MissingEvaluationCommentCell(props: {
  comment: string | null;
  disabled: boolean;
  magistrat: string;
  nominationFileId: string;
}) {
  const { formatMessage } = useIntl();
  const edit = useContext(EditMissingEvaluationCommentContext);
  if (!edit) throw new Error('MissingEvaluationCommentCell must be used within a provider');

  const openModal = () =>
    edit({
      comment: props.comment,
      magistrat: props.magistrat,
      nominationFileId: props.nominationFileId,
    });

  if (props.disabled) {
    return props.comment ? <CommentText>{props.comment}</CommentText> : null;
  }

  if (!props.comment) {
    return (
      <Button
        className="fr-btn--align-on-content"
        onClick={openModal}
        priority="tertiary no outline"
        size="small"
        title={formatMessage(
          { defaultMessage: 'Ajouter un commentaire pour {magistrat}' },
          { magistrat: props.magistrat },
        )}
      >
        <FormattedMessage defaultMessage="Ajouter" />
      </Button>
    );
  }

  const lastSpace = props.comment.trimEnd().lastIndexOf(' ');

  return (
    <CommentText>
      {props.comment.slice(0, lastSpace + 1)}
      <span className="whitespace-nowrap">
        {props.comment.slice(lastSpace + 1)}{' '}
        <button
          className="border-0 bg-transparent p-0 align-baseline text-sm/6 font-medium text-(--text-action-high-blue-france) opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
          onClick={openModal}
          title={formatMessage(
            { defaultMessage: 'Modifier le commentaire de {magistrat}' },
            { magistrat: props.magistrat },
          )}
          type="button"
        >
          <FormattedMessage defaultMessage="Modifier" />
        </button>
      </span>
    </CommentText>
  );
}

function CommentText(props: PropsWithChildren) {
  return (
    <span className="group min-w-0 text-sm/6 font-normal text-(--text-default-grey)">{props.children}</span>
  );
}
