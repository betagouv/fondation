import clsx from 'clsx';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { useUnsavedGuard } from '../../hooks/use-unsaved-guard/use-unsaved-guard.hook';
import { PrivateContentNotice } from '@/shared/components/private-content-notice';
import { useArchivedSession } from '@/shared/context/archived-session';
import { CommentEditor } from '@/shared/ui/comment-editor';
import { useUser } from '@queries/auth.queries';
import { useWriteNominationFileMemberMemoMutation } from '@queries/members.queries';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

export function MemberMemo(props: {
  memo: SessionNominationFile['memo'];
  nominationFileId: string;
  sessionId: string;
}) {
  if (!props.memo) return null;

  return (
    <div>
      <h3
        className={clsx(
          'text-xl font-semibold',
          props.memo.visibility === 'PRIVATE' ? 'fr-mb-4v' : 'fr-mb-2v',
        )}
      >
        <FormattedMessage defaultMessage="Mes notes" />
      </h3>
      {props.memo.visibility === 'PRIVATE' ? (
        <PrivateContentNotice />
      ) : (
        <MemberMemoEditor
          nominationFileId={props.nominationFileId}
          sessionId={props.sessionId}
          value={props.memo.value}
        />
      )}
    </div>
  );
}

function MemberMemoEditor(props: { nominationFileId: string; sessionId: string; value: string | null }) {
  const { formatMessage } = useIntl();
  const { isArchived } = useArchivedSession();
  const { user } = useUser();
  const { mutateAsync } = useWriteNominationFileMemberMemoMutation();

  const [isDirty, setIsDirty] = useState(false);
  const showWarning = useUnsavedGuard('member-memo', isDirty);

  if (!user) return null;

  return (
    <>
      <p className="fr-mb-4v text-sm text-(--text-mention-grey)">
        <FormattedMessage defaultMessage="Ces notes ne sont visibles que par vous" />
      </p>

      <CommentEditor
        ariaLabel={formatMessage({ defaultMessage: 'Mes notes' })}
        emptyLabel={<FormattedMessage defaultMessage="Aucune note" />}
        initialValue={props.value}
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
    </>
  );
}
