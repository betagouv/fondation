import Button from "@codegouvfr/react-dsfr/Button";
import clsx from "clsx";
import { FC } from "react";
import { ReportVM } from "../../../../core-logic/view-models/ReportVM";

export type AttachedFilesListProps = {
  attachedFiles: NonNullable<ReportVM["attachedFiles"]>;
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
          <a
            href={file.signedUrl ?? undefined}
            target="_blank"
            rel="noopener noreferrer"
          >
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
