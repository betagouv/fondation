import Button from "@codegouvfr/react-dsfr/Button";
import { cx } from "@codegouvfr/react-dsfr/fr/cx";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { useIsModalOpen } from "@codegouvfr/react-dsfr/Modal/useIsModalOpen";
import { Upload } from "@codegouvfr/react-dsfr/Upload";
import clsx from "clsx";
import { FC, useEffect, useState } from "react";
import { Magistrat } from "shared-models";
import {
  useAppDispatch,
  useAppSelector,
} from "../../../../../reports/adapters/primary/hooks/react-redux";
import { DateOnly } from "../../../../../shared-kernel/core-logic/models/date-only";
import { clearImportObservants } from "../../../../core-logic/reducers/secretariatGeneral.slice";
import { importObservantsXlsx } from "../../../../core-logic/use-cases/import-observants-xlsx/importObservantsXlsx.use-case";
import { selectImportObservantsFailed } from "../../selectors/selectImportObservantsFailed";
import { selectImportObservantsSuccessfull } from "../../selectors/selectImportObservantsSuccessfull";
import { selectImportObservantsValidationError } from "../../selectors/selectImportObservantsValidationError";
import { ImportObservantsExcelValidationAlert } from "./ImportObservantsExcelValidationAlert";

const modal = createModal({
  id: "modal-import-observations-transparence",
  isOpenedByDefault: false,
});

export interface ImportObservantsModalProps {
  nomTransparence: string;
  formation: Magistrat.Formation;
  dateTransparence: DateOnly;
}

export const ImportObservantsModal: FC<ImportObservantsModalProps> = ({
  nomTransparence,
  formation,
  dateTransparence,
}) => {
  const importObservantsExcelSuccessfull = useAppSelector(
    selectImportObservantsSuccessfull,
  );
  const importObservantsFailed = useAppSelector(selectImportObservantsFailed);
  const validationError = useAppSelector(selectImportObservantsValidationError);
  const dispatch = useAppDispatch();
  const [observantsFile, setObservantsFile] = useState<File | null>(null);

  useIsModalOpen(modal, {
    onConceal: () => {
      dispatch(clearImportObservants());
      setObservantsFile(null);
    },
  });

  const onImportObservations = () => {
    const fichier = observantsFile;
    if (!fichier) {
      throw new Error("No file selected for import.");
    }

    dispatch(
      importObservantsXlsx({
        nomTransparence,
        formation,
        dateTransparence: dateTransparence.toFormattedString("yyy-MM-dd"),
        fichier,
      }),
    );
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
            children: "Importer",
            nativeButtonProps: {
              onClick: () => {
                onImportObservations();
              },
            },
          },
        ]}
      >
        <div className={clsx("gap-8", cx("fr-grid-row"))}>
          <Upload
            id="import-observations-transparence"
            nativeInputProps={{
              onChange: (e) => {
                e.preventDefault();
                if (e.target.files && e.target.files.length === 1) {
                  setObservantsFile(e.target.files[0]!);
                }
              },
            }}
            hint={
              <div>
                Format supporté : <strong>XLSX</strong>.
              </div>
            }
            label={null}
            multiple={false}
          />

          {importObservantsFailed && (
            <ImportObservantsExcelValidationAlert
              validationError={validationError || undefined}
            />
          )}
        </div>
      </modal.Component>

      <Button nativeButtonProps={modal.buttonProps}>
        Importer les observations
      </Button>
    </div>
  );
};
