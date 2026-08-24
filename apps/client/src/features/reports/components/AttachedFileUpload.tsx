import { Upload } from '@codegouvfr/react-dsfr/Upload';
import clsx from 'clsx';
import { useIntl } from 'react-intl';

import { DOCUMENT_FILE_TYPES } from '@/constants/files.constants';
import { reportHtmlIds } from '@/features/reports/constants/html-ids.constants';
import { summaryLabels } from '@/features/reports/labels/summary-labels';
import { useArchivedSession } from '@/shared/context/archived-session';

import { AttachedFilesList } from './AttachedFilesList';
import { Card } from './Card';

export function AttachedFileUpload({
  attachments,
  onAttachedFileDeleted,
  onFilesAttached,
  reportId,
}: {
  attachments: { fileId: string; name: string }[];
  onAttachedFileDeleted: (fileName: string) => void;
  onFilesAttached: (files: File[]) => void;
  reportId: string;
}) {
  const { formatMessage } = useIntl();
  const { isArchived } = useArchivedSession();
  return (
    <Card
      id={reportHtmlIds.overview.attachedFilesSection}
      label={formatMessage({ defaultMessage: 'Pièces jointes' })}
    >
      <h2>{summaryLabels.attachedFiles}</h2>
      <div className={clsx('flex flex-col gap-6')}>
        <Upload
          disabled={isArchived}
          hint={
            <div>
              Formats supportés : <strong>png, jpeg, pdf, doc et docx</strong>
            </div>
          }
          id="report-attached-file-upload"
          label={null}
          multiple
          nativeInputProps={{
            accept: DOCUMENT_FILE_TYPES,
            onChange: (e) => {
              e.preventDefault();
              if (e.target.files && e.target.files.length > 0) {
                onFilesAttached([...e.target.files]);
              }
            },
          }}
        />

        {Boolean(attachments.length) && (
          <AttachedFilesList attachments={attachments} onDelete={onAttachedFileDeleted} reportId={reportId} />
        )}
      </div>
    </Card>
  );
}
