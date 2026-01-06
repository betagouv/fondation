import { createModal } from '@codegouvfr/react-dsfr/Modal';
import { Upload } from '@codegouvfr/react-dsfr/Upload';
import clsx from 'clsx';
import { useCallback, useState } from 'react';
import { useAddNominationSessionAttachmentMutation } from '@queries/nomination-sessions.queries';

export const modal = createModal({
  id: 'modal-import-attachment-transparence',
  isOpenedByDefault: false
});

export const ImportAttachmentModal = (props: { onSuccess: () => void; sessionId: string }) => {
  const title = 'Importer une pièce jointe';

  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const { mutate: importAttachment, isPending } = useAddNominationSessionAttachmentMutation();

  const onChangeAttachmentFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      if (e.target.files && e.target.files.length === 1) {
        setAttachmentFile(e.target.files[0]!);
      }
    },
    [setAttachmentFile]
  );

  const handleImportAttachment = useCallback(() => {
    if (!attachmentFile) {
      return;
    }

    importAttachment(
      {
        file: attachmentFile,
        sessionId: props.sessionId
      },
      {
        onSuccess: () => {
          props.onSuccess();
          setAttachmentFile(null);
          modal.close();
        },
        onError: (error: Error) => {
          console.error("Erreur lors de l'import de la pièce jointe:", error);
        }
      }
    );
  }, [attachmentFile, setAttachmentFile, props, importAttachment]);

  return (
    <modal.Component
      title={title}
      buttons={[
        {
          doClosesModal: false,
          children: isPending ? 'Import en cours...' : 'Importer',
          nativeButtonProps: {
            onClick: handleImportAttachment,
            disabled: !attachmentFile || isPending
          }
        }
      ]}
    >
      <div className={clsx('gap-8', 'fr-grid-row')}>
        <Upload
          id="import-observations-transparence"
          nativeInputProps={{
            onChange: onChangeAttachmentFile,
            disabled: isPending
          }}
          hint={null}
          label={null}
          multiple={false}
        />
      </div>
    </modal.Component>
  );
};
