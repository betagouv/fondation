import Button from '@codegouvfr/react-dsfr/Button';
import { useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { Modal } from '@/shared/ui/modal';
import { AttachmentFormatsHint, Upload } from '@/shared/ui/upload';
import { ATTACHMENT_FILE_TYPES } from '@/shared/ui/upload/file-types';

export function AddPositionVacancyAttachmentsModal(props: {
  isPending: boolean;
  onAdd: (files: File[]) => void;
  onClose: () => void;
  open: boolean;
}) {
  const [files, setFiles] = useState<File[]>([]);

  return (
    <Modal
      actions={
        <Button disabled={files.length === 0 || props.isPending} onClick={() => props.onAdd(files)}>
          {props.isPending ? (
            <FormattedMessage defaultMessage="Ajout en cours..." />
          ) : (
            <FormattedMessage defaultMessage="Ajouter" />
          )}
        </Button>
      }
      onClose={props.onClose}
      onClosed={() => setFiles([])}
      open={props.open}
      title={<FormattedMessage defaultMessage="Ajouter des justificatifs" />}
    >
      <Upload
        accept={ATTACHMENT_FILE_TYPES}
        hint={<AttachmentFormatsHint />}
        isPending={props.isPending}
        multiple
        onChange={setFiles}
      />
    </Modal>
  );
}
