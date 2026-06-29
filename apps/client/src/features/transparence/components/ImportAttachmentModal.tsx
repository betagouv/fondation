import { createModal } from '@codegouvfr/react-dsfr/Modal';
import { Upload } from '@codegouvfr/react-dsfr/Upload';
import clsx from 'clsx';
import { useCallback, useRef, useState } from 'react';

import { useAlerts } from '@/shared/context/alerts';
import { useAddNominationSessionAttachmentMutation } from '@queries/nomination-sessions.queries';

export const modal = createModal({
  id: 'modal-import-attachment-transparence',
  isOpenedByDefault: false,
});

export const ImportAttachmentModal = (props: { sessionId: string }) => {
  const alerts = useAlerts();

  const inputRef = useRef<HTMLInputElement>(null);
  const [attachmentFiles, setAttachmentFiles] = useState<FileList | null>(null);
  const { mutate: importAttachments, isPending } = useAddNominationSessionAttachmentMutation();

  const onChangeAttachmentFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
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
          alerts.pushAlert({ severity: 'success', title: 'Données actualisées' });

          setAttachmentFiles(null);
          modal.close();
        },
        onError: (error: Error) => {
          console.error("Erreur lors de l'import de la pièce jointe:", error);
        },
      },
    );
  }, [attachmentFiles, setAttachmentFiles, props, importAttachments, alerts, inputRef]);

  return (
    <modal.Component
      title={'Importer des pièces jointes'}
      buttons={[
        {
          doClosesModal: false,
          children: isPending ? 'Import en cours...' : 'Importer',
          nativeButtonProps: {
            onClick: handleImportAttachment,
            disabled: !attachmentFiles || isPending,
          },
        },
      ]}
    >
      <div className={clsx('gap-8', 'fr-grid-row')}>
        <Upload
          multiple
          id="import-observations-transparence"
          nativeInputProps={{
            ref: inputRef,
            onChange: onChangeAttachmentFile,
            disabled: isPending,
          }}
          hint={null}
          label={null}
        />
      </div>
    </modal.Component>
  );
};
