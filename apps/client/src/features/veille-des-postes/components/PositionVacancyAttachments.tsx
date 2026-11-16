import { useIntl } from 'react-intl';

import { FileList, FileListItem } from '@/shared/components/file-list';
import { useRenameAttachmentModal } from '@/shared/components/rename-attachment';
import { useConfirmModal } from '@/shared/context/confirm-modal';
import { useAttachmentFailureToast } from '@/shared/hooks/useAttachmentFailureToast';
import { useTab } from '@/shared/hooks/useTab';
import { useDownloadFileMutation } from '@queries/files.queries';
import {
  type PositionVacancy,
  useOpenPositionVacancyAttachmentMutation,
  useRemovePositionVacancyAttachmentMutation,
  useRenamePositionVacancyAttachmentMutation,
} from '@queries/veille-des-postes.queries';

type Attachment = PositionVacancy['attachments'][number];

/** the attachments already saved, titled by the form around them */
export function PositionVacancyAttachments(props: {
  attachments: Attachment[];
  labelledBy: string;
  magistratId: string;
}) {
  return (
    <FileList aria-labelledby={props.labelledBy}>
      {props.attachments.map((attachment) => (
        <PositionVacancyAttachment
          attachment={attachment}
          key={attachment.id}
          magistratId={props.magistratId}
        />
      ))}
    </FileList>
  );
}

function PositionVacancyAttachment({
  attachment,
  magistratId,
}: {
  attachment: Attachment;
  magistratId: string;
}) {
  const { formatMessage } = useIntl();
  const notifyFailure = useAttachmentFailureToast();
  const tab = useTab();
  const { waitForConfirmation } = useConfirmModal();
  const createUrl = useOpenPositionVacancyAttachmentMutation();
  const download = useDownloadFileMutation();
  const remove = useRemovePositionVacancyAttachmentMutation();
  const { mutateAsync: rename } = useRenamePositionVacancyAttachmentMutation();
  const renaming = useRenameAttachmentModal((file: Attachment, name) =>
    rename({ fileId: file.id, magistratId, name }),
  );
  const path = { fileId: attachment.id, magistratId };

  const onOpen = async () => {
    const attachmentTab = tab.openDeferred({
      message: formatMessage({ defaultMessage: 'Ouverture de la pièce jointe, merci de patienter...' }),
      title: attachment.name,
    });
    try {
      attachmentTab.settle(await createUrl.mutateAsync(path));
    } catch (error) {
      attachmentTab.cancel();
      notifyFailure('open', attachment.name, error);
    }
  };

  const onDownload = () => {
    const onError = (error: unknown) => notifyFailure('download', attachment.name, error);
    createUrl.mutate(path, {
      onError,
      onSuccess: (url) => download.mutate({ name: attachment.name, url }, { onError }),
    });
  };

  const onDelete = async () => {
    const { isConfirmed } = await waitForConfirmation({
      content: formatMessage({ defaultMessage: 'Une fois supprimé, il sera impossible de le récupérer.' }),
      i18n: {
        cancel: formatMessage({ defaultMessage: 'Annuler' }),
        confirm: formatMessage({ defaultMessage: 'Supprimer le fichier' }),
      },
      title: formatMessage({ defaultMessage: 'Veuillez confirmer la suppression du fichier' }),
    });
    if (isConfirmed) remove.mutate(path);
  };

  return (
    <FileListItem
      addedAt={attachment.addedAt}
      addedBy={attachment.addedBy}
      disabled={createUrl.isPending || download.isPending || remove.isPending}
      name={attachment.name}
      onDelete={onDelete}
      onDownload={onDownload}
      onOpen={onOpen}
      onRename={() => renaming.open(attachment)}
      size={attachment.size}
    >
      {renaming.modal}
    </FileListItem>
  );
}
