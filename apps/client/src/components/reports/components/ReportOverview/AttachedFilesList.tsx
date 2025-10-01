import clsx from 'clsx';
import type { FC } from 'react';
import type { ReportVM } from '../../../../VM/ReportVM';
import { DeleteAttachmentModal } from '../../../shared/DeleteAttachmentModal';

export type AttachedFilesListProps = {
  attachedFiles: NonNullable<ReportVM['attachedFiles']>;
  onAttachedFileDeleted: (fileName: string) => void;
};

export const AttachedFilesList: FC<AttachedFilesListProps> = ({ attachedFiles, onAttachedFileDeleted }) => (
  <ul className={clsx('flex flex-col gap-2')}>
    {attachedFiles.map((file) => {
      const deleteAttachedFile = () => onAttachedFileDeleted(file.name);

      return (
        <li key={file.name} className="flex items-center gap-4">
          <a href={file.signedUrl ?? undefined} target="_blank" rel="noopener noreferrer">
            {file.name}
          </a>
          <DeleteAttachmentModal fileName={file.name} onDelete={deleteAttachedFile} />
        </li>
      );
    })}
  </ul>
);
