import Button from '@codegouvfr/react-dsfr/Button';
import clsx from 'clsx';
import { useCallback, type ReactNode } from 'react';

import { useIsSg } from '@/features/auth/hooks/roles.hook';
import { useArchivedSession } from '@/shared/context/archived-session/useArchivedSession';
import { DeleteAttachmentModal } from '@/shared/ui/DeleteAttachmentModal';
import {
  useCreateNominationSessionAttachmentUrlMutation,
  useListNominationSessionAttachmentsQuery,
  useRemoveNominationSessionAttachmentMutation,
} from '@queries/nomination-sessions.queries';

export function NominationSessionAttachmentList(props: { sessionId: string; placeholder?: ReactNode }) {
  const { isArchived } = useArchivedSession();
  const isSg = useIsSg();
  const { data: attachments } = useListNominationSessionAttachmentsQuery({
    sessionId: props.sessionId,
  });

  const { mutate: createUrl, isPending: isUrlPending } = useCreateNominationSessionAttachmentUrlMutation();

  const onCreateUrl = useCallback(
    (fileId: string) => {
      createUrl(
        { sessionId: props.sessionId, fileId },
        {
          onSuccess: (response) => {
            if (!response) throw new Error(`failed to download`);

            const a = document.createElement('a');
            a.href = response.url;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';

            document.body.appendChild(a);

            a.click();
            a.remove();
          },
        },
      );
    },
    [createUrl, props.sessionId],
  );

  const { mutate: deleteAttachment, isPending: isDeletionPending } =
    useRemoveNominationSessionAttachmentMutation();

  if (!attachments?.items?.length)
    return props.placeholder !== undefined ? (
      props.placeholder
    ) : (
      <div className="text-center text-sm font-normal text-(--text-mention-grey)">Aucune pièce jointe.</div>
    );

  return (
    <ul className={clsx('fr-m-0 fr-p-0 flex flex-col gap-2')}>
      {(attachments?.items ?? []).map((file) => (
        <li key={file.id} className="fr-pb-0 flex items-center gap-4">
          <Button
            priority="tertiary no outline"
            className={clsx('inline truncate', { grow: !isSg })}
            disabled={isUrlPending || isDeletionPending}
            onClick={() => onCreateUrl(file.id)}
          >
            {file.name}
          </Button>

          {isSg && !isArchived && (
            <DeleteAttachmentModal
              fileName={file.name}
              onDelete={() => deleteAttachment({ fileId: file.id, sessionId: props.sessionId })}
            />
          )}
        </li>
      ))}
    </ul>
  );
}
