import { useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { FileList, FileListItem } from '@/shared/components/file-list';
import { useConfirmModal } from '@/shared/context/confirm-modal';
import { useAttachmentFailureToast } from '@/shared/hooks/useAttachmentFailureToast';
import { useTab } from '@/shared/hooks/useTab';
import { useDownloadFileMutation } from '@queries/files.queries';
import { useGenerateReportAttachmentUrlMutation } from '@queries/reports.queries';

type Attachment = { id: string; name: string };

export function AttachedFilesList(props: {
  attachments: (Attachment & {
    addedAt: string;
    addedBy: { id: string; name: string } | null;
    size: number | null;
  })[];
  isReadOnly?: boolean;
  onDelete: (fileId: string) => unknown;
  reportId: string;
}) {
  const { formatMessage } = useIntl();
  const notifyFailure = useAttachmentFailureToast();
  const tab = useTab();
  const confirmation = useConfirmModal();

  const { isPending: isCreatingUrl, mutateAsync: createAttachmentLink } =
    useGenerateReportAttachmentUrlMutation();
  const { isPending: isDownloading, mutateAsync: download } = useDownloadFileMutation();

  const onOpen = useCallback(
    async (file: Attachment) => {
      const attachmentTab = tab.openDeferred({
        message: formatMessage({ defaultMessage: 'Ouverture de la pièce jointe, merci de patienter...' }),
        title: file.name,
      });

      try {
        attachmentTab.settle(await createAttachmentLink({ fileId: file.id, reportId: props.reportId }));
      } catch (error) {
        attachmentTab.cancel();
        notifyFailure('open', file.name, error);
      }
    },
    [createAttachmentLink, formatMessage, notifyFailure, props.reportId, tab],
  );

  const onDownload = useCallback(
    async (file: Attachment) => {
      try {
        const url = await createAttachmentLink({ fileId: file.id, reportId: props.reportId });
        await download({ name: file.name, url });
      } catch (error) {
        notifyFailure('download', file.name, error);
      }
    },
    [createAttachmentLink, download, notifyFailure, props.reportId],
  );

  const onDelete = async (file: Attachment) => {
    const { isConfirmed } = await confirmation.waitForConfirmation({
      content: (
        <p>
          <FormattedMessage
            defaultMessage="Confirmez-vous la suppression du fichier: <strong>«&nbsp;{fileName}&nbsp;»</strong>"
            values={{ fileName: file.name, strong: (chunks) => <strong>{chunks}</strong> }}
          />
        </p>
      ),
      title: formatMessage({ defaultMessage: 'Confirmer la suppression du fichier' }),
    });

    if (isConfirmed) props.onDelete(file.id);
  };

  return (
    <FileList>
      {props.attachments.map((file) => (
        <FileListItem
          addedAt={file.addedAt}
          addedBy={file.addedBy}
          disabled={isCreatingUrl || isDownloading}
          key={file.id}
          name={file.name}
          onDelete={props.isReadOnly ? undefined : () => onDelete(file)}
          onDownload={() => onDownload(file)}
          onOpen={() => onOpen(file)}
          size={file.size}
        />
      ))}
    </FileList>
  );
}
