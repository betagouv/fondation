import { useCallback } from 'react';

import { useSummary } from '@/features/summary/context/SummaryContext';
import type { FilesUploader } from '@/shared/ui/tip-tap-editor';
import { TipTapEditor } from '@/shared/ui/tip-tap-editor';
import { useIncludeFileInSummaryContentMutation, useWriteSummaryMutation } from '@queries/summary.queries';

export function SummaryEditor() {
  const { sessionId, nominationFileId, summary, canWriteSummary } = useSummary();
  const { mutate: writeSummary } = useWriteSummaryMutation();
  const { mutateAsync: includeFiles } = useIncludeFileInSummaryContentMutation();

  const uploadFiles: FilesUploader = useCallback(
    async (files: readonly File[]) => {
      const data = await includeFiles({ sessionId, nominationFileId, files });
      return (data?.items ?? []).map(({ url, name, id }) => ({ id, name, url: new URL(url) }));
    },
    [sessionId, nominationFileId, includeFiles],
  );

  const onChange = useCallback(
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
