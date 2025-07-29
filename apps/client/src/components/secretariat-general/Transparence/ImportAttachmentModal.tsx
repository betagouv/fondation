import Button from '@codegouvfr/react-dsfr/Button';
import { createModal } from '@codegouvfr/react-dsfr/Modal';
import { Upload } from '@codegouvfr/react-dsfr/Upload';
import clsx from 'clsx';
import { useState } from 'react';
import { HintImportXlsxFile } from '../../shared/HintImportXlsxFile';
import { useImportAttachment } from '../../../mutations/sg/import-attachment.mutation';

type ImportAttachmentModalProps = {
  transparenceId: string;
};

const modalAttachment = createModal({
  id: 'modal-import-attachment-transparence',
  isOpenedByDefault: false
});

export const ImportAttachmentModal = ({
  transparenceId
}: ImportAttachmentModalProps) => {
  const title = 'Importer une pièce jointe';

  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const { mutate: importAttachment } = useImportAttachment();

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
    importAttachment({ sessionId: transparenceId, file: attachmentFile });
  };

  return (
    <div>
      <modalAttachment.Component
        title={title}
        buttons={[
          {
            doClosesModal: false,
            children: 'Importer',
            nativeButtonProps: {
              onClick: handleImportAttachment,
              disabled: !attachmentFile
            }
          }
        ]}
      >
        <div className={clsx('gap-8', 'fr-grid-row')}>
          <Upload
            id="import-observations-transparence"
            nativeInputProps={{
              onChange: onChangeAttachmentFile
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
      >
        {title}
      </Button>
    </div>
  );
};
