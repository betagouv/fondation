import React from 'react';

import type { FilesUploader } from '@/components/shared/ui/tip-tap-editor/extensions/editor-file-uploader';
import { reportHtmlIds } from '@/features/reports/dom/html-ids';
import { useAttachScreenshotMutation } from '@queries/reports.queries';

import { TextareaCard } from './TextareaCard';

export type ReportEditorProps = {
  comment: string | null;
  onUpdate: (comment: string) => void;
  reportId: string;
};

export const ReportEditor: React.FC<ReportEditorProps> = ({ reportId, comment, onUpdate }) => {
  const { mutateAsync } = useAttachScreenshotMutation();

  const uploadFiles = React.useCallback<FilesUploader>(
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
