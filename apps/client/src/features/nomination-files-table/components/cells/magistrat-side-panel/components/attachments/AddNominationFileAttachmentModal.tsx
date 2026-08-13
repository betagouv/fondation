import { Alert } from '@codegouvfr/react-dsfr/Alert';
import { createModal } from '@codegouvfr/react-dsfr/Modal';
import { useIsModalOpen } from '@codegouvfr/react-dsfr/Modal/useIsModalOpen';
import Select from '@codegouvfr/react-dsfr/Select';
import { Upload } from '@codegouvfr/react-dsfr/Upload';
import { useCallback, useRef, useState, type ChangeEvent } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import type { NominationFileAttachmentTypeEnum } from '@/types/enums.types';
import { useAddNominationFileAttachmentsMutation } from '@queries/nomination-sessions.queries';

import type { AttachmentTarget } from './context/AddNominationFileAttachmentModalContext';
import {
  NOMINATION_FILE_ATTACHMENT_TYPES,
  useNominationFileAttachmentTypeLabel,
} from './nomination-file-attachment-type';

export const addNominationFileAttachmentModal = createModal({
  id: 'modal-add-nomination-file-attachment',
  isOpenedByDefault: false,
});

export function AddNominationFileAttachmentModal(props: { target: AttachmentTarget | null }) {
  const { formatMessage } = useIntl();
  const label = useNominationFileAttachmentTypeLabel();

  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<readonly File[]>([]);
  const [type, setType] = useState<NominationFileAttachmentTypeEnum | ''>('');
  const { mutate: add, isPending, isError, reset } = useAddNominationFileAttachmentsMutation();

  const clear = useCallback(() => {
    if (inputRef.current) inputRef.current.value = '';
    setFiles([]);
    setType('');
    reset();
  }, [reset]);

  useIsModalOpen(addNominationFileAttachmentModal, { onConceal: clear });

  const onChangeFiles = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setFiles([...(event.target.files ?? [])]);
  }, []);

  const onSubmit = useCallback(() => {
    if (!props.target || files.length === 0 || !type) return;

    add({ ...props.target, files, type }, { onSuccess: () => addNominationFileAttachmentModal.close() });
  }, [add, files, props.target, type]);

  return (
    <addNominationFileAttachmentModal.Component
      buttons={[
        {
          children: formatMessage({ defaultMessage: 'Annuler' }),
          nativeButtonProps: { disabled: isPending },
          onClick: clear,
          priority: 'secondary',
        },
        {
          children: formatMessage({ defaultMessage: 'Ajouter à la proposition' }),
          doClosesModal: false,
          nativeButtonProps: { disabled: files.length === 0 || !type || isPending, onClick: onSubmit },
        },
      ]}
      title={formatMessage({ defaultMessage: 'Ajouter une pièce jointe' })}
    >
      <div className="fr-p-4v bg-(--background-alt-grey)">
        <Upload
          disabled={isPending}
          hint={formatMessage({ defaultMessage: 'Formats supportés : png, jpeg et pdf.' })}
          label={formatMessage({ defaultMessage: 'Importer un fichier' })}
          multiple
          nativeInputProps={{
            accept: 'image/png,image/jpeg,application/pdf',
            onChange: onChangeFiles,
            ref: inputRef,
          }}
        />
        {isPending && (
          <p aria-live="polite" className="fr-mt-2v fr-mb-0 text-sm text-(--text-mention-grey)">
            <span aria-hidden="true" className="fr-icon-refresh-line fr-icon--sm fr-mr-1v" />
            <FormattedMessage defaultMessage="Import du fichier en cours..." />
          </p>
        )}
      </div>

      <Select
        className="fr-mt-4v"
        label={
          <>
            <FormattedMessage defaultMessage="Type de document" />
            <span aria-hidden="true" className="text-(--text-default-error)">
              &nbsp;*
            </span>
          </>
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

      {isError && (
        <Alert
          className="fr-mt-2v"
          closable
          description={formatMessage({
            defaultMessage: "L'ajout de la pièce jointe a échoué. Veuillez réessayer.",
          })}
          onClose={reset}
          severity="error"
          small
        />
      )}
    </addNominationFileAttachmentModal.Component>
  );
}
