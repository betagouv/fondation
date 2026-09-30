import { useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { useConfirmModal } from '@/shared/context/confirm-modal';
import { useTab } from '@/shared/hooks/useTab';
import { FileList, FileListItem } from '@/shared/ui/file-list';
import { useToasts } from '@/shared/ui/toast';
import { useDownloadFileMutation } from '@queries/files.queries';
import { useGenerateReportFilePublicUrlMutation } from '@queries/reports.queries';

export function AttachedFilesList(props: {
  attachments: {
    addedAt: string;
    addedBy: { id: string; name: string } | null;
    fileId: string;
    name: string;
    size: number | null;
  }[];
  isReadOnly?: boolean;
  onDelete: (fileName: string) => unknown;
  reportId: string;
}) {
  const { formatMessage } = useIntl();
  const toasts = useToasts();
  const tab = useTab();
  const confirmation = useConfirmModal();

  const { isPending: isCreatingUrl, mutateAsync: createAttachmentLink } =
    useGenerateReportFilePublicUrlMutation();
  const { isPending: isDownloading, mutateAsync: download } = useDownloadFileMutation();

  const onError = useCallback(
    (title: string) =>
      toasts.error({
        description: formatMessage({ defaultMessage: 'Réessayez et prévenez le support si cela persiste.' }),
        title,
      }),
    [formatMessage, toasts],
  );

  const onOpen = useCallback(
    async (fileName: string) => {
      const attachmentTab = tab.openDeferred({
        message: formatMessage({ defaultMessage: 'Ouverture de la pièce jointe, merci de patienter...' }),
        title: fileName,
      });

      try {
        attachmentTab.settle(await createAttachmentLink({ fileName, reportId: props.reportId }));
      } catch {
        attachmentTab.cancel();
        onError(formatMessage({ defaultMessage: 'L\'ouverture de "{name}" a échoué' }, { name: fileName }));
      }
    },
    [createAttachmentLink, formatMessage, onError, props.reportId, tab],
  );

  const onDownload = useCallback(
    async (fileName: string) => {
      try {
        const url = await createAttachmentLink({ fileName, reportId: props.reportId });
        await download({ name: fileName, url });
      } catch {
        onError(
          formatMessage({ defaultMessage: 'Le téléchargement de "{name}" a échoué' }, { name: fileName }),
        );
      }
    },
    [createAttachmentLink, download, formatMessage, onError, props.reportId],
  );

  const onDelete = async (fileName: string) => {
    const { isConfirmed } = await confirmation.waitForConfirmation({
      content: (
        <p>
          <FormattedMessage
            defaultMessage="Confirmez-vous la suppression du fichier: <strong>«&nbsp;{fileName}&nbsp;»</strong>"
            values={{ fileName, strong: (chunks) => <strong>{chunks}</strong> }}
          />
        </p>
      ),
      title: formatMessage({ defaultMessage: 'Confirmer la suppression du fichier' }),
    });

    if (isConfirmed) props.onDelete(fileName);
  };

  return (
    <FileList>
      {props.attachments.map((file) => (
        <FileListItem
          addedAt={file.addedAt}
          addedBy={file.addedBy}
          disabled={isCreatingUrl || isDownloading}
          key={file.fileId}
          name={file.name}
          onDelete={props.isReadOnly ? undefined : () => onDelete(file.name)}
          onDownload={() => onDownload(file.name)}
          onOpen={() => onOpen(file.name)}
          size={file.size}
        />
      ))}
    </FileList>
  );
}
