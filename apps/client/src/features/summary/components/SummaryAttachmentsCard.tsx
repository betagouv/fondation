import { useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { useSummary } from '@/features/summary/context/SummaryContext';
import { useOpenSummaryAttachment } from '@/features/summary/hooks/useOpenSummaryAttachment';
import { FileList, FileListItem } from '@/shared/components/file-list';
import { useConfirmModal } from '@/shared/context/confirm-modal';
import { DetailsCard } from '@/shared/ui/details';
import { useToasts } from '@/shared/ui/toast';
import { Upload } from '@/shared/ui/upload';
import type { DetailedSummaryDto } from '@api/types';
import { useDownloadFileMutation } from '@queries/files.queries';
import {
  useAttachSummaryFilesMutation,
  useDetachSummaryFilesMutation,
  useGenerateSummaryAttachmentPublicUrlMutation,
} from '@queries/summary.queries';

type SummaryAttachmentDto = DetailedSummaryDto['summary']['attachments'][number];

export function SummaryAttachmentsCard() {
  const { canWriteSummary, summary } = useSummary();

  const attachmentsCount = summary.summary.attachments.length;

  return (
    <DetailsCard>
      <h2 className="fr-h6" id="summary-attachments-title">
        <FormattedMessage
          defaultMessage="{count, plural, one {Pièce jointe} other {Pièces jointes ({count})}}"
          values={{ count: attachmentsCount }}
        />
      </h2>

      {attachmentsCount ? (
        <FileList aria-labelledby="summary-attachments-title">
          {summary.summary.attachments.map((attachment) => (
            <SummaryAttachment attachment={attachment} key={attachment.id} />
          ))}
        </FileList>
      ) : canWriteSummary ? null : (
        <p className="text-sm text-(--text-mention-grey)">
          <FormattedMessage defaultMessage="Aucune pièce jointe pour le moment" />
        </p>
      )}

      <SummaryAttachmentInput />
    </DetailsCard>
  );
}

function SummaryAttachmentInput() {
  const { canWriteSummary, nominationFileId, sessionId, summary } = useSummary();
  const { isPending, mutate } = useAttachSummaryFilesMutation();

  if (!canWriteSummary) return null;

  return (
    <div className="fr-mt-6v">
      <Upload
        clearOnChange
        disabled={summary.isArchived}
        hint={<FormattedMessage defaultMessage="Tout type de fichier supporté" />}
        isPending={isPending}
        label={<FormattedMessage defaultMessage="Ajouter un fichier" />}
        multiple
        onChange={(files) => files.length > 0 && mutate({ files, nominationFileId, sessionId })}
      />
    </div>
  );
}

function SummaryAttachment({ attachment }: { attachment: SummaryAttachmentDto }) {
  const { canWriteSummary, nominationFileId, sessionId } = useSummary();
  const { formatMessage } = useIntl();
  const toasts = useToasts();

  const { isPending: isOpening, open: openAttachment } = useOpenSummaryAttachment();
  const onOpen = useCallback(() => {
    openAttachment({ fileId: attachment.id, name: attachment.name, nominationFileId, sessionId });
  }, [nominationFileId, openAttachment, attachment.id, attachment.name, sessionId]);

  const { isPending: isCreatingUrl, mutate: createUrl } = useGenerateSummaryAttachmentPublicUrlMutation();
  const { isPending: isDownloading, mutate: download } = useDownloadFileMutation();
  const onDownload = useCallback(() => {
    const onError = () =>
      toasts.error({
        description: formatMessage({ defaultMessage: 'Réessayez et prévenez le support si cela persiste.' }),
        title: formatMessage(
          { defaultMessage: 'Le téléchargement de "{name}" a échoué' },
          { name: attachment.name },
        ),
      });

    createUrl(
      { fileId: attachment.id, nominationFileId, sessionId },
      {
        onError,
        onSuccess: (url) => (url ? download({ name: attachment.name, url }, { onError }) : onError()),
      },
    );
  }, [
    createUrl,
    download,
    formatMessage,
    nominationFileId,
    attachment.id,
    attachment.name,
    sessionId,
    toasts,
  ]);

  const { isPending: isDetaching, mutate: detach } = useDetachSummaryFilesMutation();
  const { waitForConfirmation } = useConfirmModal();
  const onDelete = useCallback(async () => {
    const { isConfirmed } = await waitForConfirmation({
      content: formatMessage({
        defaultMessage: 'Une fois supprimé, il sera impossible de le récupérer.',
      }),
      i18n: {
        cancel: formatMessage({ defaultMessage: 'Annuler' }),
        confirm: formatMessage({ defaultMessage: 'Supprimer le fichier' }),
      },
      title: formatMessage({ defaultMessage: 'Veuillez confirmer la suppression du fichier' }),
    });

    if (!isConfirmed) return;

    detach({ fileIds: [attachment.id], nominationFileId, sessionId });
  }, [detach, formatMessage, nominationFileId, attachment.id, sessionId, waitForConfirmation]);

  return (
    <FileListItem
      addedAt={attachment.addedAt}
      addedBy={attachment.addedBy}
      disabled={isOpening || isCreatingUrl || isDownloading || isDetaching}
      name={attachment.name}
      onDelete={canWriteSummary ? onDelete : undefined}
      onDownload={onDownload}
      onOpen={onOpen}
      size={attachment.size}
    />
  );
}
