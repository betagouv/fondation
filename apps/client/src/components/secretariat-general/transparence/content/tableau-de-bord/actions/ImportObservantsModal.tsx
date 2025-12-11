import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import { createModal } from '@codegouvfr/react-dsfr/Modal';
import { useIsModalOpen } from '@codegouvfr/react-dsfr/Modal/useIsModalOpen';
import { Upload } from '@codegouvfr/react-dsfr/Upload';
import clsx from 'clsx';
import { type FC, useState } from 'react';

import { useMutation } from '@tanstack/react-query';
import { updateNominationSessionObserversFromLodam } from '../../../../../../react-query/mutations/sg/nomination-sessions';
import { ACCEPT_XLSX_FILE, HintImportXlsxFile } from '../../../../../shared/HintImportXlsxFile';
import { UploadExcelFailedAlert } from '../../../nouvelle-transparence/UploadExcelFailedAlert';

export const modal = createModal({
  id: 'modal-import-observations-transparence',
  isOpenedByDefault: false
});

export const ImportObservantsModal: FC<{ sessionId: string }> = ({ sessionId }) => {
  const [observantsFile, setObservantsFile] = useState<File | null>(null);

  const { mutate: importObservants, isError: importObservantsFailed } = useMutation({
    mutationFn: updateNominationSessionObserversFromLodam
  });

  useIsModalOpen(modal, {
    onConceal: () => {
      setObservantsFile(null);
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
          setObservantsFile(null);
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
      <div className={clsx('gap-8', cx('fr-grid-row'))}>
        {importObservantsFailed && (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          <UploadExcelFailedAlert validationErrors={(importObservantsFailed as any).validationErrors} />
        )}

        <Upload
          id="import-observations-transparence"
          nativeInputProps={{
            onChange: (e) => {
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
          state={importObservantsFailed ? 'error' : 'default'}
        />
      </div>
    </modal.Component>
  );
};
