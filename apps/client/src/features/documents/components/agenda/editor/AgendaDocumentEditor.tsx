import { useCallback, useState } from 'react';
import { generatePath, useNavigate } from 'react-router';

import { DocumentBlocksEditor } from '@/features/documents/components/DocumentBlocksEditor';
import { ROUTE_PATHS } from '@/utils/route-path.utils';

import { AgendaBlocksModel } from './blocks/agenda-blocks.model';
import type { AgendaBlock } from './blocks/agenda-blocks.type';
import { AgendaFileBlock } from './blocks/AgendaFileBlock';
import { useAgendaEditor } from './hooks/useAgendaEditor';

export function AgendaDocumentEditor(props: {
  sessionId: string;
  agendaId: string;
  blocks: readonly AgendaBlock[];
  onPendingRevalidationChange?: (pending: boolean) => void;
}) {
  const navigate = useNavigate();

  const [model] = useState(() => new AgendaBlocksModel({ agendaId: props.agendaId, blocks: props.blocks }));
  const editor = useAgendaEditor(model);

  const { sessionId } = props;
  const onPreview = useCallback(async () => {
    await model.onEditorUpdate(editor);
    return navigate(generatePath(ROUTE_PATHS.SG.AGENDA_RENDER, { agendaId: model.agendaId, sessionId }));
  }, [editor, model, navigate, sessionId]);

  return (
    <DocumentBlocksEditor
      blockName={AgendaFileBlock.name}
      editor={editor}
      onPendingRevalidationChange={props.onPendingRevalidationChange}
      onPreview={onPreview}
    />
  );
}
