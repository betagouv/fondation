import { cx } from "@codegouvfr/react-dsfr/fr/cx";
import { Upload } from "@codegouvfr/react-dsfr/Upload";
import { FC } from "react";
import { ReportSM } from "../../../../../store/appState";
import { AttachedFilesList } from "./AttachedFilesList";
import { Card } from "./Card";
import clsx from "clsx";

export type AttachedFileUploadProps = {
  attachedFiles: ReportSM["attachedFiles"];
  onFileAttached: (file: File) => void;
  onAttachedFileDeleted: (fileName: string) => void;
};

export const AttachedFileUpload: FC<AttachedFileUploadProps> = ({
  attachedFiles,
  onFileAttached,
  onAttachedFileDeleted,
}) => {
  return (
    <Card>
      <div className={clsx("flex flex-col gap-6")}>
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
        {attachedFiles && (
          <AttachedFilesList
            attachedFiles={attachedFiles}
            onAttachedFileDeleted={onAttachedFileDeleted}
          />
        )}
      </div>
    </Card>
  );
};
