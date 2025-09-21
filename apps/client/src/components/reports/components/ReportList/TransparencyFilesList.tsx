import clsx from 'clsx';
import type { FC } from 'react';
import type { FileVM } from 'shared-models';

export type TransparencyFilesListProps = {
  files: FileVM[];
};

export const TransparencyFilesList: FC<TransparencyFilesListProps> = ({ files }) => (
  <ul className={clsx('flex flex-col gap-2')}>
    {files.map((file) => (
      <li key={file.name} className="flex items-center gap-4">
        <a href={file.signedUrl} target="_blank" rel="noopener noreferrer">
          {file.name}
        </a>
      </li>
    ))}
  </ul>
);
