import { Alert } from '@codegouvfr/react-dsfr/Alert';
import Button from '@codegouvfr/react-dsfr/Button';
import Select from '@codegouvfr/react-dsfr/Select';
import { useCallback, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { useRequestFailure } from '@/shared/hooks/useRequestFailure';
import { Modal } from '@/shared/ui/modal';
import { RequiredLabel } from '@/shared/ui/required-label';
import { Upload } from '@/shared/ui/upload';
import { SANITIZED_FILE_TYPES } from '@/shared/ui/upload/file-types';
import { useAddNominationFileAttachmentsMutation } from '@queries/nomination-sessions.queries';

import type { AttachmentTarget } from './context/AddNominationFileAttachmentModalContext';
import {
  NOMINATION_FILE_ATTACHMENT_TYPES,
  type NominationFileAttachmentTypeEnum,
  useNominationFileAttachmentTypeLabel,
} from './nomination-file-attachment-type';

export function AddNominationFileAttachmentModal(props: {
  onClose: () => void;
  target: AttachmentTarget | null;
}) {
  const { formatMessage } = useIntl();
  const label = useNominationFileAttachmentTypeLabel();

  const [files, setFiles] = useState<readonly File[]>([]);
  const [type, setType] = useState<NominationFileAttachmentTypeEnum | ''>('');
  const { error, isPending, mutate: add, reset } = useAddNominationFileAttachmentsMutation();
  const describeFailure = useRequestFailure();

  const close = useCallback(() => {
    setFiles([]);
    setType('');
    reset();
    props.onClose();
  }, [props, reset]);

  const onSubmit = useCallback(() => {
    if (!props.target || files.length === 0 || !type) return;

    add({ ...props.target, files, type }, { onSuccess: close });
  }, [add, close, files, props.target, type]);

  return (
    <Modal
      actions={
        <>
          <Button disabled={isPending} onClick={close} priority="secondary">
            <FormattedMessage defaultMessage="Annuler" />
          </Button>
          <Button disabled={files.length === 0 || !type || isPending} onClick={onSubmit}>
            <FormattedMessage defaultMessage="Ajouter à la proposition" />
          </Button>
        </>
      }
      id="modal-add-nomination-file-attachment"
      onClose={close}
      open={props.target !== null}
      title={<FormattedMessage defaultMessage="Ajouter une pièce jointe" />}
    >
      <Upload
        accept={SANITIZED_FILE_TYPES}
        hint={<FormattedMessage defaultMessage="Formats supportés : png, jpeg et pdf" />}
        isPending={isPending}
        label={<FormattedMessage defaultMessage="Importer un fichier" />}
        multiple
        onChange={setFiles}
      />

      <Select
        className="fr-mt-4v"
        label={
          <RequiredLabel>
            <FormattedMessage defaultMessage="Type de document" />
          </RequiredLabel>
        }
        nativeSelectProps={{
          disabled: isPending,
          onChange: (event) => setType(event.target.value as NominationFileAttachmentTypeEnum),
          required: true,
          value: type,
        }}
      >
        <option disabled value="">
          {formatMessage({ defaultMessage: 'Choisir un type' })}
        </option>
        {NOMINATION_FILE_ATTACHMENT_TYPES.map((attachmentType) => (
          <option key={attachmentType} value={attachmentType}>
            {label(attachmentType)}
          </option>
        ))}
      </Select>

      {error && (
        <Alert
          className="fr-mt-2v"
          closable
          description={describeFailure(error)}
          onClose={reset}
          severity="error"
          small
          title={formatMessage({ defaultMessage: "L'ajout de la pièce jointe a échoué" })}
        />
      )}
    </Modal>
  );
}
