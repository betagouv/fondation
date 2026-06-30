import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { useUnsavedGuard } from '../../hooks/use-unsaved-guard/use-unsaved-guard.hook';
import { useIsSg } from '@/features/auth/hooks/roles.hook';
import { useArchivedSession } from '@/shared/context/archived-session';
import { CommentEditor } from '@/shared/ui/comment-editor';
import { useUser } from '@queries/auth.queries';
import { useWriteNominationFileMemberMemoMutation } from '@queries/members.queries';

export function MemberMemo(props: { sessionId: string; nominationFileId: string; memo: string | null }) {
  const { formatMessage } = useIntl();
  const { isArchived } = useArchivedSession();
  const isSg = useIsSg();
  const { user } = useUser();
  const { mutateAsync } = useWriteNominationFileMemberMemoMutation();

  const [isDirty, setIsDirty] = useState(false);
  const showWarning = useUnsavedGuard('member-memo', isDirty);

  if (!user || isSg) return null;

  return (
    <div>
      <h3 className="fr-mb-2v text-xl font-semibold">
        <FormattedMessage defaultMessage="Commentaire" />
      </h3>
      <p className="fr-mb-4v text-sm text-(--text-mention-grey)">
        <FormattedMessage defaultMessage="Ce commentaire n'est visible que par vous" />
      </p>

      <CommentEditor
        ariaLabel={formatMessage({ defaultMessage: 'Commentaire' })}
        emptyLabel={<FormattedMessage defaultMessage="Aucun commentaire" />}
        initialValue={props.memo}
        onDirtyChange={setIsDirty}
        onSave={async (value) => {
          await mutateAsync({
            memo: value ?? '',
            nominationFileId: props.nominationFileId,
            sessionId: props.sessionId,
            userId: user.id,
          });
        }}
        placeholder={formatMessage({ defaultMessage: 'Saisissez vos idées à conserver pour plus tard' })}
        readOnly={isArchived}
        warning={showWarning}
      />
    </div>
  );
}
