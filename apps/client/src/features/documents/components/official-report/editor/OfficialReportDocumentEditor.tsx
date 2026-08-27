import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { generatePath, useNavigate } from 'react-router';

import { DocumentBlocksEditor } from '@/features/documents/components/DocumentBlocksEditor';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { sessionKeys } from '@queries/nomination-sessions.queries';

import './blocks.css';
import { OfficialReportBlocksModel } from './blocks/official-report-blocks.model';
import type { OfficialReportBlock } from './blocks/official-report-blocks.type';
import { OfficialReportFileBlock } from './blocks/OfficialReportFileBlock';
import { useOfficialReportEditor } from './hooks/useOfficialReportEditor';

export function OfficialReportDocumentEditor(props: {
  sessionId: string;
  officialReportId: string;
  blocks: readonly OfficialReportBlock[];
  onPendingRevalidationChange?: (pending: boolean) => void;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [model] = useState(
    () => new OfficialReportBlocksModel({ officialReportId: props.officialReportId, blocks: props.blocks }),
  );
  const editor = useOfficialReportEditor(model);

  // block edition resets the official report pdf, which drives the files table status
  const { sessionId } = props;
  useEffect(
    () => () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.listSessionNominationFiles({ sessionId }) });
    },
    [queryClient, sessionId],
  );

  const onPreview = useCallback(async () => {
    await model.onEditorUpdate(editor);
    return navigate(
      generatePath(ROUTE_PATHS.SG.OFFICIAL_REPORT_RENDER, {
        officialReportId: model.officialReportId,
        sessionId,
      }),
    );
  }, [editor, model, navigate, sessionId]);

  return (
    <DocumentBlocksEditor
      blockName={OfficialReportFileBlock.name}
      editor={editor}
      onPendingRevalidationChange={props.onPendingRevalidationChange}
      onPreview={onPreview}
    />
  );
}
