import Button from '@codegouvfr/react-dsfr/Button';
import { Input } from '@codegouvfr/react-dsfr/Input';
import { useId, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useParams } from 'react-router';

import { useUnsavedGuard } from '../../hooks/use-unsaved-guard.hook';
import { useIsSg } from '@/features/auth/hooks/roles.hook';
import { useArchivedSession } from '@/shared/context/archived-session/useArchivedSession';
import { useUpdateNominationFileCommentMutation } from '@queries/members.queries';

export function SgComment(props: { id: string; initialComment?: string | null; nominationFileId: string }) {
  const { initialComment, nominationFileId } = props;

  const { isArchived } = useArchivedSession();
  const isSg = useIsSg();
  const { sessionId } = useParams<{ sessionId: string }>();
  const isEditable = isSg && !!sessionId;

  const id = useId();

  const showComment = !isArchived && (isSg || initialComment !== null);
  if (!showComment) return null;

  return (
    <div>
      <label className="fr-mb-2v block text-xl font-semibold" htmlFor={id}>
        <FormattedMessage defaultMessage="Complément SG" />
      </label>

      <p className="fr-mb-3v text-sm text-(--text-mention-grey)">
        <FormattedMessage defaultMessage="Ce commentaire est visible par les membres" />
      </p>

      {isEditable ? (
        <SgCommentEdit
          // remount on magistrat change to reset the unsaved draft
          key={`sg-comment-edit-${sessionId}-${nominationFileId}`}
          id={id}
          initialComment={initialComment}
          nominationFileId={nominationFileId}
          sessionId={sessionId}
        />
      ) : (
        <SgCommentView id={id} initialComment={initialComment} />
      )}
    </div>
  );
}

function SgCommentView(props: { id: string; initialComment?: string | null }) {
  const { id, initialComment } = props;
  return (
    <div
      id={id}
      className="fr-mt-2v fr-p-4v rounded-sm border border-(--border-default-grey) bg-(--background-alt-grey) whitespace-pre-line"
    >
      {initialComment || <FormattedMessage defaultMessage="Aucun commentaire" />}
    </div>
  );
}

function SgCommentEdit(props: {
  id: string;
  initialComment?: string | null;
  nominationFileId: string;
  sessionId: string;
}) {
  const { id, initialComment, nominationFileId, sessionId } = props;
  const { formatMessage } = useIntl();

  const [savedComment, setSavedComment] = useState(initialComment || '');
  const [comment, setComment] = useState(savedComment);
  const [showWarning, setShowWarning] = useState(false);
  const [hasError, setHasError] = useState(false);
  const isDirty = comment !== savedComment;

  const { mutateAsync: updateComment, isPending } = useUpdateNominationFileCommentMutation();

  useUnsavedGuard(isDirty, () => setShowWarning(true));

  const change = (value: string) => {
    setComment(value);
    setHasError(false);
  };
  const cancel = () => {
    setComment(savedComment);
    setShowWarning(false);
    setHasError(false);
  };
  const save = async () => {
    try {
      await updateComment({ comment: comment || null, nominationFileId, sessionId });
      setSavedComment(comment);
      setShowWarning(false);
      setHasError(false);
    } catch {
      setHasError(true);
    }
  };

  const warn = showWarning && isDirty;
  const errorMessage = hasError
    ? formatMessage({ defaultMessage: "Échec de l'enregistrement. Réessayez." })
    : warn
      ? formatMessage({
          defaultMessage: 'Modifications non enregistrées. Cliquez sur Valider pour sauvegarder.',
        })
      : undefined;

  return (
    <div>
      <Input
        id={id}
        label=""
        nativeTextAreaProps={{
          onChange: (e) => change(e.target.value),
          placeholder: formatMessage({ defaultMessage: 'Saisissez un commentaire…' }),
          rows: 6,
          value: comment,
        }}
        state={hasError || warn ? 'error' : 'default'}
        stateRelatedMessage={errorMessage}
        textArea
      />
      <div className="flex justify-end gap-2">
        <Button disabled={!isDirty || isPending} onClick={cancel} priority="secondary" size="small">
          <FormattedMessage defaultMessage="Annuler" />
        </Button>
        <Button disabled={!isDirty || isPending} onClick={save} priority="primary" size="small">
          <FormattedMessage defaultMessage="Valider" />
        </Button>
      </div>
    </div>
  );
}
