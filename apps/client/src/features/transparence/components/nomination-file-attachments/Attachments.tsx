import { Alert } from '@codegouvfr/react-dsfr/Alert';
import Button from '@codegouvfr/react-dsfr/Button';
import { useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { useIsSgNavigation } from '@/features/auth/hooks/roles.hook';
import type { NominationFileAttachmentTypeEnum } from '@/features/transparence/components/nomination-file-attachments/nomination-file-attachment-type';
import { FileList, FileListItem } from '@/shared/components/file-list';
import { useConfirmModal } from '@/shared/context/confirm-modal';
import { useTab } from '@/shared/hooks/useTab';
import { useDownloadFileMutation } from '@queries/files.queries';
import {
  useCreateNominationFileAttachmentUrlMutation,
  useListNominationFileAttachmentsQuery,
  useRemoveNominationFileAttachmentMutation,
} from '@queries/nomination-sessions.queries';

import { attachmentsSectionId } from './attachments-section';
import { useAddNominationFileAttachmentModal } from './context/AddNominationFileAttachmentModalContext';
import { NominationFileAttachmentTypeTag } from './NominationFileAttachmentTypeTag';

export function Attachments(props: {
  headingLevel?: 2;
  isUpdatable: boolean;
  nominationFileId: string;
  sessionId: string;
}) {
  const isSg = useIsSgNavigation();
  const { open: openAddAttachment } = useAddNominationFileAttachmentModal();
  const { data } = useListNominationFileAttachmentsQuery({
    nominationFileId: props.nominationFileId,
    sessionId: props.sessionId,
  });

  const attachments = data?.items ?? [];
  const canManage = isSg && props.isUpdatable;
  const labelId = `attachments-${props.nominationFileId}`;
  const Heading = props.headingLevel === 2 ? 'h2' : 'p';
  const headingClass = props.headingLevel === 2 ? 'fr-h6 fr-mb-0' : 'fr-mb-0 text-xl font-semibold';

  if (attachments.length === 0 && !canManage) return null;

  return (
    <div id={attachmentsSectionId(props.nominationFileId)}>
      <div className="fr-mb-4v flex items-center justify-between gap-4">
        <Heading className={headingClass} id={labelId}>
          <FormattedMessage
            defaultMessage="{count, plural, =0 {Pièces jointes du dossier} one {Pièce jointe du dossier} other {Pièces jointes du dossier ({count})}}"
            values={{ count: attachments.length }}
          />
        </Heading>
        {canManage && (
          <Button
            onClick={() =>
              openAddAttachment({
                nominationFileId: props.nominationFileId,
                sessionId: props.sessionId,
              })
            }
            priority="secondary"
            size="small"
          >
            <FormattedMessage defaultMessage="Ajouter" />
          </Button>
        )}
      </div>

      {attachments.length > 0 ? (
        <FileList aria-labelledby={labelId}>
          {attachments.map((file) => (
            <AttachmentItem
              addedAt={file.addedAt}
              addedBy={file.addedBy}
              canDelete={canManage}
              fileId={file.id}
              key={file.id}
              name={file.name}
              nominationFileId={props.nominationFileId}
              sessionId={props.sessionId}
              size={file.size}
              type={file.type}
            />
          ))}
        </FileList>
      ) : (
        <p className="fr-mb-0 text-(--text-mention-grey)">
          <FormattedMessage defaultMessage="Aucune pièce jointe n'a été ajoutée au dossier." />
        </p>
      )}
    </div>
  );
}

function AttachmentItem(props: {
  addedAt: string;
  addedBy: { id: string; name: string } | null;
  canDelete: boolean;
  fileId: string;
  name: string;
  nominationFileId: string;
  sessionId: string;
  size: number | null;
  type: NominationFileAttachmentTypeEnum;
}) {
  const { formatMessage } = useIntl();
  const tab = useTab();
  const {
    isError: isUrlError,
    isPending: isUrlPending,
    mutate: createUrl,
    reset: resetUrl,
  } = useCreateNominationFileAttachmentUrlMutation();
  const {
    isError: isDownloadError,
    isPending: isDownloadPending,
    mutate: download,
    reset: resetDownload,
  } = useDownloadFileMutation();
  const {
    isError: isRemoveError,
    isPending: isRemovePending,
    mutate: remove,
    reset: resetRemove,
  } = useRemoveNominationFileAttachmentMutation();
  const { waitForConfirmation } = useConfirmModal();

  const error =
    isUrlError || isDownloadError
      ? formatMessage({ defaultMessage: 'Le téléchargement du fichier a échoué. Veuillez réessayer.' })
      : isRemoveError
        ? formatMessage({ defaultMessage: 'La suppression du fichier a échoué. Veuillez réessayer.' })
        : null;

  const onPreview = useCallback(() => {
    const attachmentTab = tab.openDeferred({
      message: formatMessage({ defaultMessage: 'Ouverture de la pièce jointe, merci de patienter...' }),
      title: props.name,
    });

    createUrl(
      { fileId: props.fileId, nominationFileId: props.nominationFileId, sessionId: props.sessionId },
      {
        onError: () => attachmentTab.cancel(),
        onSuccess: (response) => {
          if (response) attachmentTab.settle(response.url);
          else attachmentTab.cancel();
        },
      },
    );
  }, [createUrl, formatMessage, props.fileId, props.name, props.nominationFileId, props.sessionId, tab]);

  const onDownload = useCallback(() => {
    createUrl(
      { fileId: props.fileId, nominationFileId: props.nominationFileId, sessionId: props.sessionId },
      {
        onSuccess: (response) => {
          if (response) download({ name: props.name, url: response.url });
        },
      },
    );
  }, [createUrl, download, props.fileId, props.name, props.nominationFileId, props.sessionId]);

  const onDelete = useCallback(async () => {
    const { isConfirmed } = await waitForConfirmation({
      content: (
        <p>
          <FormattedMessage
            defaultMessage="Êtes-vous sûr de vouloir supprimer la pièce jointe <b>{name}</b> ?"
            values={{ b: (chunks) => <strong>{chunks}</strong>, name: props.name }}
          />
        </p>
      ),
      i18n: {
        cancel: formatMessage({ defaultMessage: 'Annuler' }),
        confirm: formatMessage({ defaultMessage: 'Supprimer' }),
      },
      title: formatMessage({ defaultMessage: 'Supprimer la pièce jointe' }),
    });
    if (!isConfirmed) return;
    remove({ fileId: props.fileId, nominationFileId: props.nominationFileId, sessionId: props.sessionId });
  }, [
    formatMessage,
    props.fileId,
    props.name,
    props.nominationFileId,
    props.sessionId,
    remove,
    waitForConfirmation,
  ]);

  return (
    <FileListItem
      addedAt={props.addedAt}
      addedBy={props.addedBy}
      disabled={isUrlPending || isDownloadPending || isRemovePending}
      header={<NominationFileAttachmentTypeTag type={props.type} />}
      name={props.name}
      onDelete={props.canDelete ? onDelete : undefined}
      onDownload={onDownload}
      onOpen={onPreview}
      size={props.size}
    >
      {error && (
        <Alert
          className="fr-mt-2v"
          closable
          description={error}
          onClose={() => {
            resetUrl();
            resetDownload();
            resetRemove();
          }}
          severity="error"
          small
        />
      )}
    </FileListItem>
  );
}
