import Alert from '@codegouvfr/react-dsfr/Alert';
import Button from '@codegouvfr/react-dsfr/Button';
import { useCallback, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { revealAttachments } from '../magistrat-side-panel/components/attachments/attachments-section';
import { useSidePanel } from '../magistrat-side-panel/context/side-panel.context';
import { DOCUMENT_FILE_TYPES } from '@/constants/files.constants';
import { Modal } from '@/shared/ui/modal';
import { useToasts } from '@/shared/ui/toast';
import { Upload } from '@/shared/ui/upload';
import {
  useAddNominationFileAttachmentsMutation,
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
  const { formatMessage } = useIntl();
  const sidePanel = useSidePanel();
  const toasts = useToasts();

  const [attempt, setAttempt] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [hasFailed, setHasFailed] = useState(false);

  const { mutateAsync: addAttachment, isPending: isAddingAttachment } =
    useAddNominationFileAttachmentsMutation();
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
      await addAttachment({
        files,
        nominationFileId: props.nominationFile.id,
        sessionId: props.sessionId,
        type: 'FICHE_DE_JURIDICTION',
      });
    } catch {
      setHasFailed(true);
      setFiles([]);
      setAttempt((current) => current + 1);
      return;
    }

    toasts.success({
      action: {
        label: formatMessage({ defaultMessage: 'Voir les pièces jointes' }),
        onClick: () => {
          sidePanel.open(props.nominationFile.id);
          revealAttachments(props.nominationFile.id);
        },
      },
      description: formatMessage({
        defaultMessage: 'À retrouver dans les pièces jointes du magistrat.',
      }),
      title: formatMessage({ defaultMessage: 'Fiche de juridiction importée' }),
    });

    props.onClose();
  }, [addAttachment, files, formatMessage, props, sidePanel, toasts]);

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
        <FormattedMessage defaultMessage="Une fois importé, le fichier sera disponible dans les pièces jointes du magistrat, accessibles en cliquant sur son nom dans le tableau." />
      </p>

      {hasFailed && (
        <Alert
          className="fr-mb-4v"
          closable
          description={
            <>
              <p>
                <FormattedMessage defaultMessage="Il y a eu une erreur pendant le téléchargement du fichier." />
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
        onChange={setFiles}
      />
    </Modal>
  );
}
