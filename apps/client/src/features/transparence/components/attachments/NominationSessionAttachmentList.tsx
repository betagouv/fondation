import Button from '@codegouvfr/react-dsfr/Button';
import clsx from 'clsx';
import { useCallback, type ReactNode } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { useIsSg } from '@/features/auth/hooks/roles.hook';
import { useArchivedSession } from '@/shared/context/archived-session';
import { useTab } from '@/shared/hooks/useTab';
import { DeleteFileButton } from '@/shared/ui/DeleteFileButton';
import { useToasts } from '@/shared/ui/toast';
import {
  useCreateNominationSessionAttachmentUrlMutation,
  useListNominationSessionAttachmentsQuery,
  useRemoveNominationSessionAttachmentMutation,
} from '@queries/nomination-sessions.queries';

export function NominationSessionAttachmentList(props: { placeholder?: ReactNode; sessionId: string }) {
  const { formatMessage } = useIntl();
  const toasts = useToasts();
  const tab = useTab();
  const { isArchived } = useArchivedSession();
  const isSg = useIsSg();
  const { data: attachments } = useListNominationSessionAttachmentsQuery({
    sessionId: props.sessionId,
  });

  const { mutate: createUrl, isPending: isUrlPending } = useCreateNominationSessionAttachmentUrlMutation();

  const notifyOpeningFailure = useCallback(
    (name: string) =>
      toasts.error({
        description: formatMessage({
          defaultMessage: 'Réessayez et prévenez le support si cela persiste.',
        }),
        title: formatMessage({ defaultMessage: 'L\'ouverture de "{name}" a échoué' }, { name }),
      }),
    [formatMessage, toasts],
  );

  const onOpen = useCallback(
    (file: { id: string; name: string }) => {
      const attachmentTab = tab.openDeferred({
        message: formatMessage({ defaultMessage: 'Ouverture de la pièce jointe, merci de patienter...' }),
        title: file.name,
      });

      createUrl(
        { fileId: file.id, sessionId: props.sessionId },
        {
          onError: () => {
            attachmentTab.cancel();
            notifyOpeningFailure(file.name);
          },
          onSuccess: (response) => {
            if (response) return attachmentTab.settle(response.url);

            attachmentTab.cancel();
            notifyOpeningFailure(file.name);
          },
        },
      );
    },
    [createUrl, formatMessage, notifyOpeningFailure, props.sessionId, tab],
  );

  const { mutate: deleteAttachment, isPending: isDeletionPending } =
    useRemoveNominationSessionAttachmentMutation();

  if (!attachments?.items?.length)
    return props.placeholder !== undefined ? (
      props.placeholder
    ) : (
      <div className="text-center text-sm font-normal text-(--text-mention-grey)">
        <FormattedMessage defaultMessage="Aucune pièce jointe" />
      </div>
    );

  return (
    <ul className={clsx('fr-m-0 fr-p-0 flex flex-col gap-2')}>
      {(attachments?.items ?? []).map((file) => (
        <li key={file.id} className="fr-pb-0 flex items-center gap-4">
          <Button
            className={clsx('inline truncate', { grow: !isSg })}
            disabled={isUrlPending || isDeletionPending}
            onClick={() => onOpen(file)}
            priority="tertiary no outline"
          >
            {file.name}
          </Button>

          {isSg && !isArchived && (
            <DeleteFileButton
              fileName={file.name}
              onDelete={() =>
                deleteAttachment({
                  fileId: file.id,
                  sessionId: props.sessionId,
                })
              }
            />
          )}
        </li>
      ))}
    </ul>
  );
}
