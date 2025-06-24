import clsx from "clsx";
import { FC } from "react";

export type TransparencyFilesListProps = {
  files: { name: string; url: string }[];
};

export const TransparencyFilesList: FC<TransparencyFilesListProps> = ({
  files,
}) => (
  <ul className={clsx("flex flex-col gap-2")}>
    {files.map((file) => (
      <li key={file.name} className="flex items-center gap-4">
        <a href={file.url} target="_blank" rel="noopener noreferrer">
          {file.name}
        </a>
      </li>
    ))}
  </ul>
);
