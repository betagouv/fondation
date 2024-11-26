import { Upload } from "@codegouvfr/react-dsfr/Upload";
import { FC } from "react";
import { Card } from "./Card";
import { cx } from "@codegouvfr/react-dsfr/fr/cx";
import { ReportSM } from "../../../../store/appState";
import { AttachedFilesList } from "./AttachedFilesList";

export type AttachedFileUploadProps = {
  attachedFiles: ReportSM["attachedFiles"];
  onFileAttached: (file: File) => void;
};

export const AttachedFileUpload: FC<AttachedFileUploadProps> = ({
  attachedFiles,
  onFileAttached,
}) => {
  return (
    <Card>
      <Upload
        id="report-attached-file-upload"
        nativeInputProps={{
          onChange: (e) => {
            e.preventDefault();
            if (e.target.files && e.target.files.length > 0) {
              onFileAttached(e.target.files[0]!);
            }
          },
        }}
        label={<div className={cx("fr-h2")}>Ajouter des pièces jointes</div>}
        hint="Formats supportés : png, jpeg et pdf."
        multiple={false}
      />
      {attachedFiles && <AttachedFilesList attachedFiles={attachedFiles} />}
    </Card>
  );
};
