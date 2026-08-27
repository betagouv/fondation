import { useCallback, type FC } from 'react';

import { reportHtmlIds } from '@/features/reports/constants/html-ids.constants';
import type { FilesUploader } from '@/shared/ui/tip-tap-editor';
import { useAttachScreenshotMutation } from '@queries/reports.queries';

import { TextareaCard } from './TextareaCard';

export type ReportEditorProps = {
  comment: string | null;
  onUpdate: (comment: string) => void;
  reportId: string;
};

export const ReportEditor: FC<ReportEditorProps> = ({ reportId, comment, onUpdate }) => {
  const { mutateAsync } = useAttachScreenshotMutation();

  const uploadFiles = useCallback<FilesUploader>(
    async (files: readonly File[]) => {
      const result = await mutateAsync({ files: files as File[], reportId });
      return (result?.items ?? []).map(({ id, name, url }) => ({ id, name, url: new URL(url) }));
    },
    [mutateAsync, reportId],
  );

  return (
    <TextareaCard
      cardId={reportHtmlIds.overview.commentSection}
      titleId={reportHtmlIds.overview.comment}
      label="Rapport"
      content={comment}
      onContentChange={onUpdate}
      uploadFiles={uploadFiles}
    />
  );
};
