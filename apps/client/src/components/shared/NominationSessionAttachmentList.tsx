import Button from '@codegouvfr/react-dsfr/Button';
import clsx from 'clsx';
import { useCallback } from 'react';

import { useUser } from '@queries/auth.queries';
import {
  useCreateNominationSessionAttachmentUrlMutation,
  useListNominationSessionAttachmentsQuery,
  useRemoveNominationSessionAttachmentMutation
} from '@queries/nomination-sessions.queries';

import { DeleteAttachmentModal } from './DeleteAttachmentModal';

export function NominationSessionAttachmentList(props: { sessionId: string }) {
  const { user } = useUser();
  const { data: attachments } = useListNominationSessionAttachmentsQuery({
    sessionId: props.sessionId
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
          }
        }
      );
    },
    [createUrl, props.sessionId]
  );

  const { mutate: deleteAttachment, isPending: isDeletionPending } =
    useRemoveNominationSessionAttachmentMutation();

  if (!attachments?.items?.length) return <div>Aucune pièce jointe.</div>;

  return (
    <ul className={clsx('flex flex-col gap-2')}>
      {(attachments?.items ?? []).map((file) => (
        <li key={file.id} className="flex items-center gap-4">
          <Button
            priority="tertiary no outline"
            className="text-ellipsis"
            disabled={isUrlPending || isDeletionPending}
            onClick={() => onCreateUrl(file.id)}
          >
            {file.name}
          </Button>

          {user?.role === 'ADJOINT_SECRETAIRE_GENERAL' && (
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
