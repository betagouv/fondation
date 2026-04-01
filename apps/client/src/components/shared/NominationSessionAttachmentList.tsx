import Button from '@codegouvfr/react-dsfr/Button';
import clsx from 'clsx';
import { useCallback, type ReactNode } from 'react';

import {
  useCreateNominationSessionAttachmentUrlMutation,
  useListNominationSessionAttachmentsQuery,
  useRemoveNominationSessionAttachmentMutation
} from '@queries/nomination-sessions.queries';

import { useIsSg } from '@/hooks/roles.hook';
import { DeleteAttachmentModal } from './DeleteAttachmentModal';

export function NominationSessionAttachmentList(props: { sessionId: string; placeholder?: ReactNode }) {
  const isSg = useIsSg();
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

  if (!attachments?.items?.length)
    return props.placeholder !== undefined ? (
      props.placeholder
    ) : (
      <div className="text-center text-sm font-normal text-gray-600">Aucune pièce jointe.</div>
    );

  return (
    <ul className={clsx('m-0 flex flex-col gap-2 p-0')}>
      {(attachments?.items ?? []).map((file) => (
        <li key={file.id} className="flex items-center gap-4 pb-0">
          <Button
            priority="tertiary no outline"
            className="flex-grow text-ellipsis text-left"
            disabled={isUrlPending || isDeletionPending}
            onClick={() => onCreateUrl(file.id)}
          >
            {file.name}
          </Button>

          {isSg && (
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
