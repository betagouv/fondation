import Button from '@codegouvfr/react-dsfr/Button';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useOutletContext } from 'react-router';

import { AddSessionAttachmentModal } from '@/features/transparence/components/attachments/AddSessionAttachmentModal';
import { SessionAttachmentsTab } from '@/features/transparence/components/attachments/SessionAttachmentsTab';
import type { SessionAttachment } from '@/features/transparence/components/attachments/SessionAttachmentsTable';
import { useRenameAttachmentModal } from '@/shared/components/rename-attachment';
import { useArchivedSession } from '@/shared/context/archived-session';
import { DeleteFileButton } from '@/shared/ui/DeleteFileButton';
import { IconButton } from '@/shared/ui/icon-button';
import { ACTION_ICONS } from '@/shared/ui/icons';
import { useToasts } from '@/shared/ui/toast';
import {
  useRemoveNominationSessionAttachmentMutation,
  useRenameNominationSessionAttachmentMutation,
} from '@queries/nomination-sessions.queries';

import type { TransparenceOutletContext } from './transparence-outlet-context.type';

export function TransparenceAttachmentsTab() {
  const { formatMessage } = useIntl();
  const toasts = useToasts();
  const { isArchived } = useArchivedSession();
  const { filtersSlot, toolbarSlot, transparence } = useOutletContext<TransparenceOutletContext>();
  const [isAdding, setIsAdding] = useState(false);

  const { mutate: deleteAttachment } = useRemoveNominationSessionAttachmentMutation();
  const { mutateAsync: renameAttachment } = useRenameNominationSessionAttachmentMutation();
  const renaming = useRenameAttachmentModal((file: SessionAttachment, name) =>
    renameAttachment({ fileId: file.id, name, sessionId: transparence.id }),
  );

  return (
    <>
      <AddSessionAttachmentModal
        onClose={() => setIsAdding(false)}
        open={isAdding}
        sessionId={transparence.id}
      />
      {renaming.modal}

      <SessionAttachmentsTab
        extraActions={(attachment) =>
          isArchived ? null : (
            <>
              <IconButton
                iconId={ACTION_ICONS.edit}
                label={formatMessage({ defaultMessage: 'Renommer {name}' }, { name: attachment.name })}
                onClick={() => renaming.open(attachment)}
                small
              />
              <DeleteFileButton
                fileName={attachment.name}
                onDelete={() =>
                  deleteAttachment(
                    { fileId: attachment.id, sessionId: transparence.id },
                    {
                      onError: () =>
                        toasts.error({
                          description: formatMessage({
                            defaultMessage: 'Réessayez et prévenez le support si cela persiste.',
                          }),
                          title: formatMessage(
                            { defaultMessage: 'La suppression de "{name}" a échoué' },
                            { name: attachment.name },
                          ),
                        }),
                    },
                  )
                }
              />
            </>
          )
        }
        filtersSlot={filtersSlot}
        headerEnd={
          !isArchived && (
            <Button
              className="py-2!"
              iconId="fr-icon-add-line"
              onClick={() => setIsAdding(true)}
              priority="primary"
              size="small"
            >
              <FormattedMessage defaultMessage="Ajouter une pièce jointe" />
            </Button>
          )
        }
        scrollsWithPage
        sessionId={transparence.id}
        toolbarSlot={toolbarSlot}
      />
    </>
  );
}
