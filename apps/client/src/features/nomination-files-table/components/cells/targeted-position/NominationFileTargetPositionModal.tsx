import Alert from '@codegouvfr/react-dsfr/Alert';
import Button from '@codegouvfr/react-dsfr/Button';
import { useCallback, useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { DOCUMENT_FILE_TYPES } from '@/constants/files.constants';
import { Modal } from '@/shared/ui/modal';
import { Upload } from '@/shared/ui/upload';
import {
  useAddNominationSessionAttachmentMutation,
  useNominationFilesAlertMutation,
  type SessionNominationFile,
} from '@queries/nomination-sessions.queries';

export function NominationFileTargetPositionModal(props: {
  nominationFile: SessionNominationFile;
  onClose: () => void;
  onClosed: () => void;
  open: boolean;
  sessionId: string;
}) {
  const [attempt, setAttempt] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [hasFailed, setHasFailed] = useState(false);

  const { mutateAsync: addAttachment, isPending: isAddingAttachment } =
    useAddNominationSessionAttachmentMutation();
  const { mutateAsync: deleteAlert, isPending: isDeletingAlert } = useNominationFilesAlertMutation({
    sessionId: props.sessionId,
  });

  const isPending = isAddingAttachment || isDeletingAlert;

  const dismissAlert = useCallback(async () => {
    await deleteAlert({ nominationFileId: props.nominationFile.id });
    props.onClose();
  }, [deleteAlert, props]);

  const onSave = useCallback(async () => {
    setHasFailed(false);

    try {
      await addAttachment({ files, sessionId: props.sessionId });
    } catch {
      setHasFailed(true);
      setFiles([]);
      setAttempt((current) => current + 1);
      return;
    }

    await dismissAlert();
  }, [addAttachment, dismissAlert, files, props.sessionId]);

  return (
    <Modal
      actions={
        <>
          <Button disabled={isPending} onClick={dismissAlert} priority="secondary">
            <FormattedMessage defaultMessage="Ignorer cette alerte" />
          </Button>
          <Button disabled={files.length === 0 || isPending} onClick={onSave}>
            <FormattedMessage defaultMessage="Sauvegarder" />
          </Button>
        </>
      }
      onClose={props.onClose}
      onClosed={props.onClosed}
      open={props.open}
      title={<FormattedMessage defaultMessage="Fiche de juridiction" />}
    >
      <p>
        <FormattedMessage
          defaultMessage="Le poste de <bold>{position}</bold> pour la proposition {reference} peut nécessiter une fiche de juridiction."
          values={{
            bold: (chunks) => <strong>{chunks}</strong>,
            position: props.nominationFile.content.posteCible,
            reference: props.nominationFile.content.numeroDeDossier,
          }}
        />
      </p>
      <p>
        <FormattedMessage defaultMessage="Une fois importé, le fichier sera disponible dans les pièces jointes de la session." />
      </p>

      {hasFailed && (
        <Alert
          className="fr-mb-4v"
          closable
          description={
            <>
              <p>
                <FormattedMessage
                  defaultMessage="Il y a eu une erreur pendant le téléchargement {count, plural, one {du fichier} other {des fichiers}}."
                  values={{ count: files.length }}
                />
              </p>
              <p>
                <FormattedMessage defaultMessage="Merci de réessayer." />
              </p>
            </>
          }
          onClose={() => setHasFailed(false)}
          severity="error"
          title={<FormattedMessage defaultMessage="Erreur pendant le téléchargement" />}
        />
      )}

      <Upload
        accept={DOCUMENT_FILE_TYPES}
        hasError={hasFailed}
        hint={<FormattedMessage defaultMessage="Formats supportés : png, jpeg, pdf, doc et docx" />}
        isPending={isPending}
        key={attempt}
        label={<FormattedMessage defaultMessage="Importer un fichier" />}
        multiple
        onChange={setFiles}
      />
    </Modal>
  );
}
