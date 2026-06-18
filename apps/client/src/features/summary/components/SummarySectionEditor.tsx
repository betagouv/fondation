import React from 'react';

import { TipTapEditor } from '@/components/reports/components/ReportOverview/TipTapEditor';
import type { FilesUploader } from '@/components/reports/components/ReportOverview/TipTapEditor/extensions/editor-file-uploader';
import { useSummary } from '@/features/summary/context/SummaryContext';
import { useIncludeFileInSummaryContentMutation, useWriteSummaryMutation } from '@queries/summary.queries';

export function SummaryEditor() {
  const { sessionId, nominationFileId, summary, canWriteSummary } = useSummary();
  const { mutate: writeSummary } = useWriteSummaryMutation();
  const { mutateAsync: includeFiles } = useIncludeFileInSummaryContentMutation();

  const uploadFiles: FilesUploader = React.useCallback(
    async (files: readonly File[]) => {
      const data = await includeFiles({ sessionId, nominationFileId, files });
      return (data?.items ?? []).map(({ url, name, id }) => ({ id, name, url: new URL(url) }));
    },
    [sessionId, nominationFileId, includeFiles],
  );

  const onChange = React.useCallback(
    (content: string) => {
      writeSummary({ sessionId, nominationFileId, content });
    },
    [sessionId, nominationFileId, writeSummary],
  );

  if (!canWriteSummary) return null;

  return (
    <TipTapEditor
      onChange={onChange}
      uploadFiles={uploadFiles}
      value={summary.summary.content}
      ariaLabelledby="synthese-title"
    />
  );
}
