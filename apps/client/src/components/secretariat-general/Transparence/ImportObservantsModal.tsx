import Button from '@codegouvfr/react-dsfr/Button';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import { createModal } from '@codegouvfr/react-dsfr/Modal';
import { useIsModalOpen } from '@codegouvfr/react-dsfr/Modal/useIsModalOpen';
import { Upload } from '@codegouvfr/react-dsfr/Upload';
import clsx from 'clsx';
import { type FC, useEffect, useState } from 'react';
import { Magistrat } from 'shared-models';
import { ImportObservantsExcelValidationAlert } from './ImportObservantsExcelValidationAlert';
import type { DateOnly } from '../../../models/date-only.model';
import { useImportObservants } from '../../../mutations/sg/import-observants.mutation';

const modal = createModal({
  id: 'modal-import-observations-transparence',
  isOpenedByDefault: false
});

export interface ImportObservantsModalProps {
  nomTransparence: string;
  formation: Magistrat.Formation;
  dateTransparence: DateOnly;
}

export const ImportObservantsModal: FC<ImportObservantsModalProps> = ({
  nomTransparence,
  formation,
  dateTransparence
}) => {
  const [observantsFile, setObservantsFile] = useState<File | null>(null);

  const {
    mutate: importObservants,
    isError: importObservantsFailed,
    isSuccess: importObservantsExcelSuccessfull
  } = useImportObservants();

  useIsModalOpen(modal, {
    onConceal: () => {
      setObservantsFile(null);
    }
  });

  const onImportObservations = () => {
    const fichier = observantsFile;
    if (!fichier) {
      throw new Error('No file selected for import.');
    }
    importObservants({
      nomTransparence,
      formation,
      dateTransparence: dateTransparence.toFormattedString('yyy-MM-dd'),
      fichier
    });
  };

  useEffect(() => {
    if (importObservantsExcelSuccessfull) {
      modal.close();
      setObservantsFile(null);
    }
  }, [importObservantsExcelSuccessfull]);

  return (
    <div>
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
          <Upload
            id="import-observations-transparence"
            nativeInputProps={{
              onChange: (e) => {
                e.preventDefault();
                if (e.target.files && e.target.files.length === 1) {
                  setObservantsFile(e.target.files[0]!);
                }
              }
            }}
            hint={
              <div>
                Format supporté : <strong>XLSX</strong>.
              </div>
            }
            label={null}
            multiple={false}
          />

          {importObservantsFailed && <ImportObservantsExcelValidationAlert />}
        </div>
      </modal.Component>

      <Button nativeButtonProps={modal.buttonProps}>
        Importer les observations
      </Button>
    </div>
  );
};
