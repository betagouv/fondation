import Alert from '@codegouvfr/react-dsfr/Alert';
import Button from '@codegouvfr/react-dsfr/Button';
import { useCallback, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { DOCUMENT_FILE_TYPES } from '@/constants/files.constants';
import { Modal } from '@/shared/ui/modal';
import { useToasts } from '@/shared/ui/toast';
import { Upload } from '@/shared/ui/upload';
import { useAddNominationSessionAttachmentMutation } from '@queries/nomination-sessions.queries';

export function ImportAttachmentModal(props: { onClose: () => void; open: boolean; sessionId: string }) {
  const { formatMessage } = useIntl();
  const toasts = useToasts();

  const [files, setFiles] = useState<File[]>([]);
  const [attempt, setAttempt] = useState(0);
  const [hasFailed, setHasFailed] = useState(false);
  const { mutate: importAttachments, isPending } = useAddNominationSessionAttachmentMutation();

  const onImport = useCallback(() => {
    if (files.length === 0) return;

    setHasFailed(false);
    importAttachments(
      { files, sessionId: props.sessionId },
      {
        onError: () => {
          setFiles([]);
          setAttempt((current) => current + 1);
          setHasFailed(true);
        },
        onSuccess: () => {
          toasts.success({ title: formatMessage({ defaultMessage: 'Données actualisées' }) });

          props.onClose();
        },
      },
    );
  }, [files, formatMessage, importAttachments, props, toasts]);

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
      {hasFailed && (
        <Alert
          className="fr-mb-4v"
          description={formatMessage({
            defaultMessage: 'Réessayez et prévenez le support si cela persiste.',
          })}
          role="alert"
          severity="error"
          small
          title={formatMessage({ defaultMessage: "L'import des pièces jointes a échoué" })}
        />
      )}

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
