import Button from '@codegouvfr/react-dsfr/Button';
import { useCallback, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { DOCUMENT_FILE_TYPES } from '@/constants/files.constants';
import { useAlerts } from '@/shared/context/alerts';
import { Modal } from '@/shared/ui/modal';
import { Upload } from '@/shared/ui/upload';
import { useAddNominationSessionAttachmentMutation } from '@queries/nomination-sessions.queries';

export function ImportAttachmentModal(props: { onClose: () => void; open: boolean; sessionId: string }) {
  const { formatMessage } = useIntl();
  const alerts = useAlerts();

  const [files, setFiles] = useState<File[]>([]);
  const [attempt, setAttempt] = useState(0);
  const { mutate: importAttachments, isPending } = useAddNominationSessionAttachmentMutation();

  const onImport = useCallback(() => {
    if (files.length === 0) return;

    importAttachments(
      { files, sessionId: props.sessionId },
      {
        onError: () => {
          setFiles([]);
          setAttempt((current) => current + 1);

          alerts.pushAlert({
            description: formatMessage({
              defaultMessage: 'Réessayez et prévenez le support si cela persiste.',
            }),
            severity: 'error',
            title: formatMessage({ defaultMessage: "L'import des pièces jointes a échoué" }),
          });
        },
        onSuccess: () => {
          alerts.pushAlert({
            severity: 'success',
            title: formatMessage({ defaultMessage: 'Données actualisées' }),
          });

          props.onClose();
        },
      },
    );
  }, [alerts, files, formatMessage, importAttachments, props]);

  return (
    <Modal
      actions={
        <Button disabled={files.length === 0 || isPending} onClick={onImport}>
          {isPending ? (
            <FormattedMessage defaultMessage="Import en cours..." />
          ) : (
            <FormattedMessage defaultMessage="Importer" />
          )}
        </Button>
      }
      onClose={props.onClose}
      open={props.open}
      title={<FormattedMessage defaultMessage="Importer des pièces jointes" />}
    >
      <Upload
        accept={DOCUMENT_FILE_TYPES}
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
