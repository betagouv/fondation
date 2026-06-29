import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useParams } from 'react-router';

import { useUnsavedGuard } from '../../hooks/use-unsaved-guard/use-unsaved-guard.hook';
import { useIsSg } from '@/features/auth/hooks/roles.hook';
import { useArchivedSession } from '@/shared/context/archived-session';
import { CommentEditor } from '@/shared/ui/comment-editor';
import { useUpdateNominationFileCommentMutation } from '@queries/members.queries';

export function SgComment(props: { initialComment?: string | null; nominationFileId: string }) {
  const { initialComment, nominationFileId } = props;
  const { formatMessage } = useIntl();
  const { isArchived } = useArchivedSession();
  const isSg = useIsSg();
  const { sessionId } = useParams<{ sessionId: string }>();
  const { mutateAsync } = useUpdateNominationFileCommentMutation();

  const [isDirty, setIsDirty] = useState(false);
  const showWarning = useUnsavedGuard('sg-comment', isDirty);

  const isEditable = isSg && !!sessionId;
  const showComment = !isArchived && (isSg || initialComment != null);
  if (!showComment) return null;

  return (
    <div>
      <h3 className="fr-mb-2v text-xl font-semibold">
        <FormattedMessage defaultMessage="Complément SG" />
      </h3>
      <p className="fr-mb-3v text-sm text-(--text-mention-grey)">
        <FormattedMessage defaultMessage="Ce commentaire est visible par les membres" />
      </p>

      <CommentEditor
        ariaLabel={formatMessage({ defaultMessage: 'Complément SG' })}
        emptyLabel={<FormattedMessage defaultMessage="Aucun commentaire" />}
        initialValue={initialComment ?? null}
        onDirtyChange={setIsDirty}
        onSave={(comment) => mutateAsync({ comment, nominationFileId, sessionId: sessionId! })}
        placeholder={formatMessage({ defaultMessage: 'Saisissez un commentaire…' })}
        readOnly={!isEditable}
        warning={showWarning}
      />
    </div>
  );
}
