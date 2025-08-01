import Button from '@codegouvfr/react-dsfr/Button';
import clsx from 'clsx';
import type { FC } from 'react';
import type { FileVM } from 'shared-models';

export type AttachedFilesListProps = {
  attachedFiles: NonNullable<FileVM[]>;
  onAttachedFileDeleted: (fileName: string) => void;
};

export const AttachedFilesList: FC<AttachedFilesListProps> = ({
  attachedFiles,
  onAttachedFileDeleted
}) => (
  <ul className={clsx('flex flex-col gap-2')}>
    {attachedFiles.map((file) => {
      const deleteAttachedFile = () => onAttachedFileDeleted(file.id);

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
