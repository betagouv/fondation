import { Upload } from "@codegouvfr/react-dsfr/Upload";
import clsx from "clsx";
import { FC } from "react";
import { ReportVM } from "../../../../core-logic/view-models/ReportVM";
import { reportHtmlIds } from "../../dom/html-ids";
import { summaryLabels } from "../../labels/summary-labels";
import { AttachedFilesList } from "./AttachedFilesList";
import { Card } from "./Card";

export type AttachedFileUploadProps = {
  attachedFiles: ReportVM["attachedFiles"];
  onFilesAttached: (files: File[]) => void;
  onAttachedFileDeleted: (fileName: string) => void;
};

export const AttachedFileUpload: FC<AttachedFileUploadProps> = ({
  attachedFiles,
  onFilesAttached,
  onAttachedFileDeleted,
}) => {
  return (
    <Card
      id={reportHtmlIds.overview.attachedFilesSection}
      label="Pièces jointes"
    >
      <h2>{summaryLabels.attachedFiles}</h2>
      <div className={clsx("flex flex-col gap-6")}>
        <Upload
          id="report-attached-file-upload"
          nativeInputProps={{
            onChange: (e) => {
              e.preventDefault();
              if (e.target.files && e.target.files.length > 0) {
                onFilesAttached([...e.target.files]);
              }
            },
          }}
          hint="Formats supportés : png, jpeg et pdf."
          label={null}
          multiple
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
