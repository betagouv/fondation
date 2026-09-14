import Button from '@codegouvfr/react-dsfr/Button';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useOutletContext } from 'react-router';

import { AffectationVersionStatusBadge } from '@/features/nomination-files-table/components/AffectationVersionStatusBadge';
import { ImportAttachmentModal } from '@/features/transparence/components/attachments/ImportAttachmentModal';
import { SessionAttachmentsTab } from '@/features/transparence/components/attachments/SessionAttachmentsTab';
import { useArchivedSession } from '@/shared/context/archived-session';
import { DeleteFileButton } from '@/shared/ui/DeleteFileButton';
import { useToasts } from '@/shared/ui/toast';
import { useRemoveNominationSessionAttachmentMutation } from '@queries/nomination-sessions.queries';

import type { TransparenceOutletContext } from './transparence-outlet-context.type';

export function TransparenceAttachmentsTab() {
  const { formatMessage } = useIntl();
  const toasts = useToasts();
  const { isArchived } = useArchivedSession();
  const { filtersSlot, transparence } = useOutletContext<TransparenceOutletContext>();
  const [isImporting, setIsImporting] = useState(false);

  const { mutate: deleteAttachment } = useRemoveNominationSessionAttachmentMutation();

  return (
    <>
      <ImportAttachmentModal
        onClose={() => setIsImporting(false)}
        open={isImporting}
        sessionId={transparence.id}
      />

      <SessionAttachmentsTab
        extraActions={(attachment) =>
          isArchived ? null : (
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
          )
        }
        filtersSlot={filtersSlot}
        headerEnd={
          !isArchived && (
            <Button
              className="py-2!"
              iconId="fr-icon-add-line"
              onClick={() => setIsImporting(true)}
              priority="primary"
              size="small"
            >
              <FormattedMessage defaultMessage="Ajouter une pièce jointe" />
            </Button>
          )
        }
        headerStart={<AffectationVersionStatusBadge sessionId={transparence.id} />}
        sessionId={transparence.id}
      />
    </>
  );
}
