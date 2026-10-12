import type { Editor, JSONContent } from '@tiptap/core';
import { useEditor } from '@tiptap/react';
import { useEffect, useMemo } from 'react';
import { useDebouncedCallback } from 'use-debounce';

import { agendaInlineExtensions, buildAgendaExtensions } from '../agenda-tiptap-extensions';
import { AgendaBlocksModel } from '../blocks/agenda-blocks.model';
import { AgendaFileBlock } from '../blocks/AgendaFileBlock';

export function useAgendaEditor(model: AgendaBlocksModel) {
  const extensions = useMemo(() => buildAgendaExtensions(model), [model]);

  const content = modelToDoc(model);
  // short enough for the save button to light up as the reader stops typing, long enough
  // to spare a diff of every block on each keystroke. Nothing reaches the server here.
  const onUpdate = useDebouncedCallback(
    ({ editor }: { editor: Editor }) => model.onEditorUpdate(editor),
    200,
  );

  useEffect(
    () => () => {
      onUpdate.flush();
    },
    [onUpdate],
  );

  const editor = useEditor({
    content,
    extensions,
    onCreate: ({ editor }) => model.withEditor(editor),
    onUpdate,
  });

  return { editor, flushUpdates: () => onUpdate.flush() };
}

function modelToDoc({ agendaId, blocks }: AgendaBlocksModel): JSONContent {
  const sorted = blocks.toSorted((a, b) => a.weight - b.weight);

  const content = sorted.flatMap((block) => AgendaFileBlock.map(agendaId, block, agendaInlineExtensions));

  return { type: 'doc', content };
}
