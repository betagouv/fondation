import Alert from '@codegouvfr/react-dsfr/Alert';
import Button from '@codegouvfr/react-dsfr/Button';
import { useCallback, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { useRequestFailure } from '@/shared/hooks/useRequestFailure';
import { Modal } from '@/shared/ui/modal';
import { useToasts } from '@/shared/ui/toast';
import { Upload } from '@/shared/ui/upload';
import { DOCUMENT_FILE_TYPES } from '@/shared/ui/upload/file-types';
import { useAddNominationSessionAttachmentMutation } from '@queries/nomination-sessions.queries';

export function ImportAttachmentModal(props: { onClose: () => void; open: boolean; sessionId: string }) {
  const { formatMessage } = useIntl();
  const toasts = useToasts();
  const describeFailure = useRequestFailure();

  const [files, setFiles] = useState<File[]>([]);
  const [attempt, setAttempt] = useState(0);
  const [failure, setFailure] = useState<unknown>(null);
  const { mutate: importAttachments, isPending } = useAddNominationSessionAttachmentMutation();

  const onImport = useCallback(() => {
    if (files.length === 0) return;

    setFailure(null);
    importAttachments(
      { files, sessionId: props.sessionId },
      {
        onError: (error) => {
          setFiles([]);
          setAttempt((current) => current + 1);
          setFailure(error);
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
      {failure !== null && (
        <Alert
          className="fr-mb-4v"
          description={describeFailure(failure)}
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
