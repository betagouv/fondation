import { createModal } from '@codegouvfr/react-dsfr/Modal';
import { Upload } from '@codegouvfr/react-dsfr/Upload';
import clsx from 'clsx';
import { type ChangeEvent, useCallback, useRef, useState } from 'react';
import { useIntl } from 'react-intl';

import { useAlerts } from '@/shared/context/alerts';
import { useAddNominationSessionAttachmentMutation } from '@queries/nomination-sessions.queries';

export const modal = createModal({
  id: 'modal-import-attachment-transparence',
  isOpenedByDefault: false,
});

export const ImportAttachmentModal = (props: { sessionId: string }) => {
  const { formatMessage } = useIntl();
  const alerts = useAlerts();

  const inputRef = useRef<HTMLInputElement>(null);
  const [attachmentFiles, setAttachmentFiles] = useState<FileList | null>(null);
  const { mutate: importAttachments, isPending } = useAddNominationSessionAttachmentMutation();

  const onChangeAttachmentFile = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      if (e.target.files && e.target.files.length > 0) {
        setAttachmentFiles(e.target.files);
      }
    },
    [setAttachmentFiles],
  );

  const handleImportAttachment = useCallback(() => {
    if (!attachmentFiles) return;

    importAttachments(
      {
        files: attachmentFiles,
        sessionId: props.sessionId,
      },
      {
        onSettled() {
          if (!inputRef.current) return;

          inputRef.current.value = '';
          inputRef.current.files = null;
        },
        onSuccess: () => {
          alerts.pushAlert({
            severity: 'success',
            title: formatMessage({ defaultMessage: 'Données actualisées' }),
          });

          setAttachmentFiles(null);
          modal.close();
        },
        onError: () => {
          alerts.pushAlert({
            severity: 'error',
            title: formatMessage({ defaultMessage: "L'import des pièces jointes a échoué" }),
            description: formatMessage({
              defaultMessage: 'Réessayez et prévenez le support si cela persiste.',
            }),
          });
        },
      },
    );
  }, [attachmentFiles, setAttachmentFiles, props, importAttachments, alerts, formatMessage, inputRef]);

  return (
    <modal.Component
      buttons={[
        {
          children: isPending
            ? formatMessage({ defaultMessage: 'Import en cours...' })
            : formatMessage({ defaultMessage: 'Importer' }),
          doClosesModal: false,
          nativeButtonProps: {
            disabled: !attachmentFiles || isPending,
            onClick: handleImportAttachment,
          },
        },
      ]}
      title={formatMessage({ defaultMessage: 'Importer des pièces jointes' })}
    >
      <div className={clsx('gap-8', 'fr-grid-row')}>
        <Upload
          hint={null}
          id="import-observations-transparence"
          label={null}
          multiple
          nativeInputProps={{
            disabled: isPending,
            onChange: onChangeAttachmentFile,
            ref: inputRef,
          }}
        />
      </div>
    </modal.Component>
  );
};
