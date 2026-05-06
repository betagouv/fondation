import Alert from '@codegouvfr/react-dsfr/Alert';
import { createModal } from '@codegouvfr/react-dsfr/Modal';
import { useIsModalOpen } from '@codegouvfr/react-dsfr/Modal/useIsModalOpen';
import { Upload } from '@codegouvfr/react-dsfr/Upload';
import React from 'react';

import {
  useAddNominationSessionAttachmentMutation,
  useNominationFilesAlertMutation,
  type SessionNominationFile,
} from '@queries/nomination-sessions.queries';

import { NominationFileTargetPositionContext } from './NominationFileTargetPositionContext';

export const nominationFileTargetPositionModal = createModal({
  id: 'nomination-file-target-position-modal',
  isOpenedByDefault: false,
});

export function NominationFileTargetPositionProvider(props: React.PropsWithChildren<{ sessionId: string }>) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = React.useState<File[]>([]);
  const [nominationFile, setNominationFile] = React.useState<SessionNominationFile | null>(null);

  const [error, setError] = React.useState<{
    title: string;
    description: NonNullable<React.ReactNode>;
  } | null>(null);

  const {
    mutateAsync: addAttachment,
    isPending: isAddingAttachment,
    reset: resetAttachments,
  } = useAddNominationSessionAttachmentMutation();
  const {
    mutateAsync: deleteAlert,
    isPending: isDeletingAlert,
    reset: resetAlert,
  } = useNominationFilesAlertMutation({
    sessionId: props.sessionId,
  });

  const isPending = isAddingAttachment || isDeletingAlert;

  useIsModalOpen(nominationFileTargetPositionModal, {
    onConceal() {
      resetAlert();
      resetAttachments();
      setNominationFile(null);
      setFiles([]);
      setError(null);

      if (inputRef.current) {
        inputRef.current.files = null;
        inputRef.current.value = '';
      }
    },
  });

  const onUploadChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    setFiles(fileList === null ? [] : [...fileList]);
  }, []);

  const onSave = React.useCallback(async () => {
    if (!nominationFile) return;

    await addAttachment(
      { sessionId: props.sessionId, files },
      {
        onError() {
          setError({
            title: `Erreur pendant le téléchargement`,
            description: (
              <>
                <p>
                  Il y a eu une erreur pendant le téléchargement{' '}
                  {files.length > 1 ? `des fichiers` : `du fichier`}
                </p>
                <p>Merci de réessayer.</p>
              </>
            ),
          });

          setFiles([]);
          if (inputRef.current) {
            inputRef.current.files = null;
            inputRef.current.value = '';
          }
        },
        onSettled(_data, error) {
          if (error) throw new Error(`Error while uploading`);
        },
      },
    );

    await deleteAlert({ nominationFileId: nominationFile.id });
    nominationFileTargetPositionModal.close();
  }, [props, files, addAttachment, deleteAlert, setError, nominationFile]);

  const onCancel = React.useCallback(async () => {
    if (nominationFile) {
      await deleteAlert({ nominationFileId: nominationFile.id });
    }

    nominationFileTargetPositionModal.close();
  }, [nominationFile, deleteAlert]);

  return (
    <>
      <nominationFileTargetPositionModal.Component
        title="Fiche de juridiction"
        buttons={[
          {
            children: 'Ignorer cette alerte',
            priority: 'secondary',
            doClosesModal: false,
            onClick: onCancel,
            disabled: isPending,
          },
          {
            children: 'Sauvegarder',
            priority: 'primary',
            doClosesModal: false,
            disabled: files.length === 0 || isPending,
            onClick: onSave,
          },
        ]}
      >
        {nominationFile !== null ? (
          <>
            <p>
              Le poste de <strong>{nominationFile.content.posteCible}</strong> pour la proposition{' '}
              {nominationFile.content.numeroDeDossier} peut nécessiter une fiche de juridiction.
            </p>
            <p>Une fois téléchargé le fichier sera disponible dans les pièces jointes de la session.</p>

            {error ? (
              <Alert
                className="mb-4"
                severity="error"
                title={error.title}
                description={error.description}
                closable
                onClose={() => {
                  setError(null);
                }}
              />
            ) : null}

            <Upload
              multiple
              label="Télécharger la fiche"
              hint="pas de restriction"
              nativeInputProps={{ onChange: onUploadChange, ref: inputRef }}
              state={error ? 'error' : undefined}
              stateRelatedMessage={error ? error.title : undefined}
            />
          </>
        ) : null}
      </nominationFileTargetPositionModal.Component>

      <NominationFileTargetPositionContext value={{ nominationFile, setNominationFile }}>
        {props.children}
      </NominationFileTargetPositionContext>
    </>
  );
}
