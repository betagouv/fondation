import { useCallback } from 'react';

import type { FilesUploader } from '@/shared/ui/tip-tap-editor';
import { useAttachScreenshotMutation } from '@queries/reports.queries';

import { ReportCommentCard } from './ReportCommentCard';

export function ReportEditor(props: {
  comment: string | null;
  isReadOnly: boolean;
  onUpdate: (comment: string) => void;
  reportId: string;
}) {
  const { reportId } = props;
  const { mutateAsync } = useAttachScreenshotMutation();

  const uploadFiles = useCallback<FilesUploader>(
    async (files: readonly File[]) => {
      const result = await mutateAsync({ files: files as File[], reportId });
      return (result?.items ?? []).map(({ id, name, url }) => ({ id, name, url: new URL(url) }));
    },
    [mutateAsync, reportId],
  );

  return (
    <ReportCommentCard
      comment={props.comment}
      isReadOnly={props.isReadOnly}
      onUpdate={props.onUpdate}
      uploadFiles={uploadFiles}
    />
  );
}
