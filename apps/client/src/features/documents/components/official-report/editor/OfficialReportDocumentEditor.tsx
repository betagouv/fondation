import { useCallback, useImperativeHandle, useState, type RefObject } from 'react';
import { useIntl } from 'react-intl';
import { generatePath, useNavigate } from 'react-router';

import { DocumentBlocksEditor } from '@/features/documents/components/DocumentBlocksEditor';
import { ROUTE_PATHS } from '@/utils/route-path.utils';

import './blocks.css';
import { OfficialReportBlocksModel } from './blocks/official-report-blocks.model';
import type { OfficialReportBlock } from './blocks/official-report-blocks.type';
import { OfficialReportFileBlock } from './blocks/OfficialReportFileBlock';
import { useOfficialReportEditor } from './hooks/useOfficialReportEditor';

export type OfficialReportDocumentEditorHandle = {
  discard: () => void;
  save: () => Promise<void>;
};

export function OfficialReportDocumentEditor(props: {
  blocks: readonly OfficialReportBlock[];
  handleRef?: RefObject<OfficialReportDocumentEditorHandle | null>;
  officialReportId: string;
  onDirtyChange?: (isDirty: boolean) => void;
  onPendingRevalidationChange?: (pending: boolean) => void;
  sessionId: string;
}) {
  const navigate = useNavigate();
  const { formatMessage } = useIntl();

  const { onDirtyChange, sessionId } = props;
  const [isDirty, setIsDirty] = useState(false);
  const trackDirty = useCallback(
    (dirty: boolean) => {
      setIsDirty(dirty);
      onDirtyChange?.(dirty);
    },
    [onDirtyChange],
  );

  const [model] = useState(
    () =>
      new OfficialReportBlocksModel({
        blocks: props.blocks,
        officialReportId: props.officialReportId,
        onDirtyChange: trackDirty,
      }),
  );
  const { editor, flushUpdates } = useOfficialReportEditor(model);

  // the staging is debounced: it has to run before saving, or the last keystrokes stay behind
  const save = useCallback(async () => {
    flushUpdates();
    await model.save();
  }, [flushUpdates, model]);

  useImperativeHandle(props.handleRef, () => ({
    discard: () => model.discard(),
    save,
  }));

  // only the save button writes to the server: leaving with pending changes is the unsaved
  // changes guard's business, which asks before anything is sent
  const onPreview = useCallback(
    async () =>
      navigate(
        generatePath(ROUTE_PATHS.SG.OFFICIAL_REPORT_PREVIEW, {
          officialReportId: model.officialReportId,
          sessionId,
        }),
      ),
    [model.officialReportId, navigate, sessionId],
  );

  return (
    <DocumentBlocksEditor
      blockName={OfficialReportFileBlock.name}
      editor={editor}
      onPendingRevalidationChange={props.onPendingRevalidationChange}
      onPreview={onPreview}
      previewDisabledReason={
        isDirty
          ? formatMessage({ defaultMessage: "Enregistrez vos changements pour accéder à l'aperçu" })
          : undefined
      }
    />
  );
}
