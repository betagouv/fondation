import Button from '@codegouvfr/react-dsfr/Button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';

import { Role } from 'shared-models';

import {
  createNominationSessionAttachmentUrlMutation,
  removeNominationSessionAttachmentMutation,
  useListNominationSessionAttachmentsQuery
} from '../../react-query/mutations/sg/nomination-sessions';
import { useUser } from '../../react-query/queries/use-user.queries';
import { DeleteAttachmentModal } from './DeleteAttachmentModal';

export function NominationSessionAttachmentList(props: { sessionId: string }) {
  const queryClient = useQueryClient();

  const { user } = useUser();
  const { data: attachments } = useListNominationSessionAttachmentsQuery({
    sessionId: props.sessionId
  });

  const { mutate: createUrl, isPending: isUrlPending } = useMutation({
    mutationKey: ['create-nomination-session-attachment-url', props.sessionId],
    mutationFn: async (fileId: string) => {
      const response = await createNominationSessionAttachmentUrlMutation({
        sessionId: props.sessionId,
        fileId
      });
      if (!response) throw new Error(`failed to download`);

      const a = document.createElement('a');
      a.href = response.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';

      document.body.appendChild(a);

      a.click();
      a.remove();
    }
  });

  const { mutate: deleteAttachment, isPending: isDeletionPending } = useMutation({
    mutationKey: ['delete-session-attachment', props.sessionId],
    mutationFn: (fileId: string) =>
      removeNominationSessionAttachmentMutation({ sessionId: props.sessionId, fileId }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['list-nomination-session-attachments', props.sessionId]
      });
    }
  });

  if (!attachments?.items.length) return <div>Aucune pièce jointe.</div>;

  return (
    <ul className={clsx('flex flex-col gap-2')}>
      {(attachments?.items ?? []).map((file) => (
        <li key={file.id} className="flex items-center gap-4">
          <Button
            priority="tertiary no outline"
            className="text-ellipsis"
            disabled={isUrlPending || isDeletionPending}
            onClick={() => createUrl(file.id)}
          >
            {file.name}
          </Button>

          {user?.role === Role.ADJOINT_SECRETAIRE_GENERAL && (
            <DeleteAttachmentModal fileName={file.name} onDelete={() => deleteAttachment(file.id)} />
          )}
        </li>
      ))}
    </ul>
  );
}
