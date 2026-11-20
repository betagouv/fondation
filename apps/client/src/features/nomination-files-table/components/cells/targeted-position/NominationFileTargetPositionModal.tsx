import Alert from '@codegouvfr/react-dsfr/Alert';
import Button from '@codegouvfr/react-dsfr/Button';
import { useCallback, useState } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { useSidePanel } from '../magistrat-side-panel/context/side-panel.context';
import { revealAttachments } from '@/features/transparence/components/nomination-file-attachments/attachments-section';
import { failureOf, useRequestFailure } from '@/shared/hooks/useRequestFailure';
import { Modal } from '@/shared/ui/modal';
import { useToasts } from '@/shared/ui/toast';
import { AttachmentFormatsHint, Upload } from '@/shared/ui/upload';
import { ATTACHMENT_FILE_TYPES } from '@/shared/ui/upload/file-types';
import {
  useAddNominationFileAttachmentsMutation,
  useNominationFilesAlertMutation,
  type SessionNominationFile,
} from '@queries/nomination-sessions.queries';

// see CantUpdateNominationFiles: both mutations then reload the listing, without the alert,
// while the modal, already open, only lets the user close it
const FROZEN = defineMessages({
  description: {
    defaultMessage: 'Il ne reçoit plus de fiche de juridiction et son alerte ne peut plus être ignorée.',
  },
  title: { defaultMessage: 'Le dossier a été figé entre-temps' },
});

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
  const [saveError, setSaveError] = useState<unknown>(null);

  const { mutateAsync: addAttachment, isPending: isAddingAttachment } =
    useAddNominationFileAttachmentsMutation();
  const {
    error: dismissError,
    isPending: isDeletingAlert,
    mutate: deleteAlert,
    reset: resetDismiss,
  } = useNominationFilesAlertMutation({ sessionId: props.sessionId });
  const describeFailure = useRequestFailure();
  const isFrozen = [dismissError, saveError].some((error) => failureOf(error).reason === 'conflict');

  const isPending = isAddingAttachment || isDeletingAlert;

  const dismissAlert = useCallback(() => {
    deleteAlert({ nominationFileId: props.nominationFile.id }, { onSuccess: props.onClose });
  }, [deleteAlert, props]);

  const onSave = useCallback(async () => {
    setSaveError(null);

    try {
      await addAttachment({
        files,
        nominationFileId: props.nominationFile.id,
        sessionId: props.sessionId,
        type: 'FICHE_DE_JURIDICTION',
      });
    } catch (error) {
      setSaveError(error);
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
          <Button disabled={isPending || isFrozen} onClick={dismissAlert} priority="secondary">
            <FormattedMessage defaultMessage="Ignorer cette alerte" />
          </Button>
          <Button disabled={files.length === 0 || isPending || isFrozen} onClick={onSave}>
            <FormattedMessage defaultMessage="Sauvegarder" />
          </Button>
        </>
      }
      onClose={props.onClose}
      onClosed={props.onClosed}
      open={props.open}
      title={<FormattedMessage defaultMessage="Fiche de juridiction" />}
    >
      <p className="leading-7">
        <FormattedMessage
          defaultMessage="Le poste de <bold>{position}</bold> pour la proposition {reference} peut nécessiter une fiche de juridiction."
          values={{
            bold: (chunks) => <strong>{chunks}</strong>,
            position: props.nominationFile.content.posteCible,
            reference: props.nominationFile.content.numeroDeDossier,
          }}
        />
      </p>
      <p className="leading-7">
        <FormattedMessage defaultMessage="Une fois importé, le fichier sera disponible dans les pièces jointes du magistrat dans le panneau latéral." />
      </p>

      {isFrozen && (
        <Alert
          className="fr-mb-4v"
          description={formatMessage(FROZEN.description)}
          severity="error"
          small
          title={formatMessage(FROZEN.title)}
        />
      )}

      {!isFrozen && dismissError && (
        <Alert
          className="fr-mb-4v"
          closable
          description={describeFailure(dismissError)}
          onClose={resetDismiss}
          severity="error"
          small
          title={formatMessage({ defaultMessage: "L'alerte n'a pas pu être ignorée" })}
        />
      )}

      {!isFrozen && saveError !== null && (
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
          onClose={() => setSaveError(null)}
          severity="error"
          title={<FormattedMessage defaultMessage="Erreur pendant le téléchargement" />}
        />
      )}

      <Upload
        accept={ATTACHMENT_FILE_TYPES}
        disabled={isFrozen}
        hasError={saveError !== null}
        hint={<AttachmentFormatsHint />}
        isPending={isPending}
        key={attempt}
        onChange={setFiles}
      />
    </Modal>
  );
}
