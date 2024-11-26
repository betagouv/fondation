import { FC } from "react";
import { ReportSM } from "../../../../store/appState";

export type AttachedFilesListProps = {
  attachedFiles: NonNullable<ReportSM["attachedFiles"]>;
};

export const AttachedFilesList: FC<AttachedFilesListProps> = ({
  attachedFiles,
}) => (
  <ul>
    {attachedFiles.map((file) => (
      <li key={file.name}>
        <a href={file.signedUrl} target="_blank" rel="noopener noreferrer">
          {file.name}
        </a>
      </li>
    ))}
  </ul>
);
