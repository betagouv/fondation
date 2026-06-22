import { Upload } from '@codegouvfr/react-dsfr/Upload';
import clsx from 'clsx';
import type { FC } from 'react';

import { reportHtmlIds } from '@/features/reports/constants/html-ids.constants';
import { summaryLabels } from '@/features/reports/labels/summary-labels';
import { useArchivedSession } from '@/shared/context/archived-session/useArchivedSession';

import { AttachedFilesList } from './AttachedFilesList';
import { Card } from './Card';

export type AttachedFileUploadProps = {
  reportId: string;
  attachments: { fileId: string; name: string }[];
  onFilesAttached: (files: File[]) => void;
  onAttachedFileDeleted: (fileName: string) => void;
};

export const AttachedFileUpload: FC<AttachedFileUploadProps> = ({
  reportId,
  attachments,
  onFilesAttached,
  onAttachedFileDeleted,
}) => {
  const { isArchived } = useArchivedSession();
  return (
    <Card id={reportHtmlIds.overview.attachedFilesSection} label="Pièces jointes">
      <h2>{summaryLabels.attachedFiles}</h2>
      <div className={clsx('flex flex-col gap-6')}>
        <Upload
          disabled={isArchived}
          id="report-attached-file-upload"
          nativeInputProps={{
            onChange: (e) => {
              e.preventDefault();
              if (e.target.files && e.target.files.length > 0) {
                onFilesAttached([...e.target.files]);
              }
            },
          }}
          hint={
            <div>
              Formats supportés : <strong>png, jpeg et pdf</strong>.
            </div>
          }
          label={null}
          multiple
        />

        {Boolean(attachments.length) && (
          <AttachedFilesList reportId={reportId} attachments={attachments} onDelete={onAttachedFileDeleted} />
        )}
      </div>
    </Card>
  );
};
