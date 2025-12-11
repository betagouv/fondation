import { createModal } from '@codegouvfr/react-dsfr/Modal';
import { Upload } from '@codegouvfr/react-dsfr/Upload';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { useCallback, useState } from 'react';
import { addNominationSessionAttachmentMutation } from '../../../../../../react-query/mutations/sg/nomination-sessions';

export const modal = createModal({
  id: 'modal-import-attachment-transparence',
  isOpenedByDefault: false
});

export const ImportAttachmentModal = (props: { onSuccess: () => void; sessionId: string }) => {
  const queryClient = useQueryClient();
  const title = 'Importer une pièce jointe';

  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const { mutate: importAttachment, isPending } = useMutation({
    mutationFn: addNominationSessionAttachmentMutation,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['list-nomination-session-attachments', props.sessionId] })
  });

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
