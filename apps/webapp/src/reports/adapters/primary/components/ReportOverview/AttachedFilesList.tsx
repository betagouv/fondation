import clsx from "clsx";
import { FC } from "react";
import { ReportSM } from "../../../../../store/appState";
import Button from "@codegouvfr/react-dsfr/Button";

export type AttachedFilesListProps = {
  attachedFiles: NonNullable<ReportSM["attachedFiles"]>;
  onAttachedFileDeleted: (fileName: string) => void;
};

export const AttachedFilesList: FC<AttachedFilesListProps> = ({
  attachedFiles,
  onAttachedFileDeleted,
}) => (
  <ul className={clsx("flex flex-col gap-2")}>
    {attachedFiles.map((file) => {
      const deleteAttachedFile = () => onAttachedFileDeleted(file.name);

      return (
        <li key={file.name} className="flex items-center gap-4">
          <a href={file.signedUrl} target="_blank" rel="noopener noreferrer">
            {file.name}
          </a>
          <Button
            priority="tertiary no outline"
            iconId="fr-icon-delete-bin-fill"
            title={`delete-attached-file-${file.name}`}
            onClick={deleteAttachedFile}
          />
        </li>
      );
    })}
  </ul>
);
