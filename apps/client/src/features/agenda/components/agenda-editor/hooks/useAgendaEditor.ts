import type { Editor, JSONContent } from '@tiptap/core';
import { useEditor } from '@tiptap/react';
import React from 'react';
import { useDebouncedCallback } from 'use-debounce';

import { agendaInlineExtensions, buildAgendaExtensions } from '../agenda-tiptap-extensions';
import { AgendaBlocksModel } from '../blocks/agenda-blocks.model';
import { AgendaFileBlock } from '../blocks/AgendaFileBlock';

export function useAgendaEditor(model: AgendaBlocksModel): Editor {
  const extensions = React.useMemo(() => buildAgendaExtensions(model), [model]);

  const content = modelToDoc(model);
  const onUpdate = useDebouncedCallback(
    ({ editor }: { editor: Editor }) => model.onEditorUpdate(editor),
    600,
  );

  React.useEffect(
    () => () => {
      onUpdate.flush();
    },
    [onUpdate],
  );

  return useEditor({
    extensions,
    content,
    onUpdate,
    onCreate: ({ editor }) => model.withEditor(editor),
  });
}

function modelToDoc({ agendaId, blocks }: AgendaBlocksModel): JSONContent {
  const sorted = blocks.toSorted((a, b) => a.weight - b.weight);

  const content = sorted.flatMap((block) => AgendaFileBlock.map(agendaId, block, agendaInlineExtensions));

  return { type: 'doc', content };
}
