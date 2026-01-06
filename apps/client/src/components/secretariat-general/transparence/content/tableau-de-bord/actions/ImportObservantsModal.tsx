import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import { createModal } from '@codegouvfr/react-dsfr/Modal';
import { useIsModalOpen } from '@codegouvfr/react-dsfr/Modal/useIsModalOpen';
import { Upload } from '@codegouvfr/react-dsfr/Upload';
import clsx from 'clsx';
import { type FC, useRef, useState } from 'react';

import { useUpdateNominationSessionObserversFromLodamMutation } from '@queries/nomination-sessions.queries';
import { ACCEPT_XLSX_FILE, HintImportXlsxFile } from '../../../../../shared/HintImportXlsxFile';
import { UploadExcelFailedAlert } from '../../../nouvelle-transparence/UploadExcelFailedAlert';

export const modal = createModal({
  id: 'modal-import-observations-transparence',
  isOpenedByDefault: false
});

export const ImportObservantsModal: FC<{
  sessionId: string;
  onSuccess: () => void;
}> = ({ sessionId, onSuccess }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [observantsFile, setObservantsFile] = useState<File | null>(null);

  const {
    reset,
    mutate: importObservants,
    isError: importObservantsFailed,
    error: importObservantsError
  } = useUpdateNominationSessionObserversFromLodamMutation();

  useIsModalOpen(modal, {
    onConceal: () => {
      setObservantsFile(null);
      reset();
      onSuccess();

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  });

  const onImportObservations = () => {
    if (!observantsFile) {
      throw new Error('No file selected for import.');
    }
    importObservants(
      {
        sessionId,
        file: observantsFile
      },
      {
        onSuccess: () => {
          modal.close();
        }
      }
    );
  };

  return (
    <modal.Component
      title="Importer les observations"
      buttons={[
        {
          doClosesModal: false,
          children: 'Importer',
          nativeButtonProps: {
            onClick: () => {
              onImportObservations();
            }
          }
        }
      ]}
    >
      {importObservantsFailed && (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        <UploadExcelFailedAlert validationErrors={(importObservantsError as any).validationErrors} />
      )}
      <div className={clsx('gap-8', cx('fr-grid-row'))}>
        <Upload
          id="import-observations-transparence"
          nativeInputProps={{
            ref: fileInputRef,
            onChange: (e) => {
              reset();

              e.preventDefault();
              if (e.target.files && e.target.files.length === 1) {
                setObservantsFile(e.target.files[0]!);
              }
            },
            accept: ACCEPT_XLSX_FILE
          }}
          hint={<HintImportXlsxFile />}
          label={null}
          multiple={false}
        />
      </div>
    </modal.Component>
  );
};
