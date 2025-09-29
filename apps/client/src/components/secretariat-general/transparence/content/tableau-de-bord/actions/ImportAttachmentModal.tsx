import Button from '@codegouvfr/react-dsfr/Button';
import { createModal } from '@codegouvfr/react-dsfr/Modal';
import { Upload } from '@codegouvfr/react-dsfr/Upload';
import clsx from 'clsx';
import { useState } from 'react';
import type { Magistrat } from 'shared-models';
import type { DateOnly } from '../../../../../../models/date-only.model';
import { useImportAttachment } from '../../../../../../react-query/mutations/sg/import-attachment.mutation';

type ImportAttachmentModalProps = {
  sessionImportId: string;
  transparenceName: string;
  transparenceFormation: Magistrat.Formation;
  transparenceDate: DateOnly;
};

const modalAttachment = createModal({
  id: 'modal-import-attachment-transparence',
  isOpenedByDefault: false
});

export const ImportAttachmentModal = ({
  sessionImportId,
  transparenceName,
  transparenceFormation,
  transparenceDate
}: ImportAttachmentModalProps) => {
  const title = 'Importer une pièce jointe';

  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const { mutate: importAttachment, isPending } = useImportAttachment();

  const handleOpenModal = () => {
    modalAttachment.open();
  };

  const onChangeAttachmentFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length === 1) {
      setAttachmentFile(e.target.files[0]!);
    }
  };

  const handleImportAttachment = () => {
    if (!attachmentFile) {
      return;
    }
    importAttachment(
      {
        sessionImportId,
        dateSession: transparenceDate,
        formation: transparenceFormation,
        name: transparenceName,
        file: attachmentFile
      },
      {
        onSuccess: () => {
          setAttachmentFile(null);
          modalAttachment.close();
        },
        onError: (error: Error) => {
          console.error("Erreur lors de l'import de la pièce jointe:", error);
        }
      }
    );
  };

  return (
    <div>
      <modalAttachment.Component
        title={title}
        buttons={[
          {
            doClosesModal: false,
            children: isPending ? 'Import en cours...' : 'Importer',
            nativeButtonProps: {
              onClick: handleImportAttachment,
              disabled: !attachmentFile || isPending
            }
          }
        ]}
      >
        <div className={clsx('gap-8', 'fr-grid-row')}>
          <Upload
            id="import-observations-transparence"
            nativeInputProps={{
              onChange: onChangeAttachmentFile,
              disabled: isPending
            }}
            hint={null}
            label={null}
            multiple={false}
          />
        </div>
      </modalAttachment.Component>
      <Button
        id="import-attachment-transparence"
        priority="secondary"
        onClick={handleOpenModal}
        className={'w-full'}
      >
        {title}
      </Button>
    </div>
  );
};
