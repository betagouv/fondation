import type { AnyExtension, Editor, JSONContent } from '@tiptap/core';
import { useEditor } from '@tiptap/react';
import { useEffect, useMemo } from 'react';
import { useDebouncedCallback } from 'use-debounce';

import { OfficialReportBlocksModel } from '../blocks/official-report-blocks.model';
import { OfficialReportConclusionBlock } from '../blocks/OfficialReportConclusionBlock';
import { OfficialReportFileBlock } from '../blocks/OfficialReportFileBlock';
import { OfficialReportIntroBlock } from '../blocks/OfficialReportIntroBlock';
import { OfficialReportSectionIntroBlock } from '../blocks/OfficialReportSectionIntroBlock';
import { OfficialReportSectionTitleBlock } from '../blocks/OfficialReportSectionTitleBlock';
import { buildOfficialReportExtensions } from '../official-report-tiptap-extensions';
import { assertNever } from '@/utils/types.util';

export function useOfficialReportEditor(model: OfficialReportBlocksModel) {
  const extensions = useMemo(() => buildOfficialReportExtensions(model), [model]);

  const content = modelToDoc(model, extensions);
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
    extensions,
    content,
    onUpdate,
    onCreate: ({ editor }) => model.withEditor(editor),
  });

  return { editor, flushUpdates: () => onUpdate.flush() };
}

function modelToDoc(
  { officialReportId, blocks }: OfficialReportBlocksModel,
  extensions: AnyExtension[],
): JSONContent {
  const sorted = blocks.toSorted((a, b) => a.weight - b.weight);

  const content: JSONContent[] = [];
  let currentFileList: { type: 'fileListBlock'; content: JSONContent[] } | undefined;

  for (const block of sorted) {
    if (OfficialReportFileBlock.handles(block)) {
      if (!currentFileList) {
        currentFileList = { type: 'fileListBlock', content: [] };
      }

      currentFileList.content.push(...OfficialReportFileBlock.map(officialReportId, block, extensions));
      continue;
    } else {
      if (OfficialReportIntroBlock.handles(block)) {
        content.push(...OfficialReportIntroBlock.map(officialReportId, block, extensions));
        continue;
      }

      if (currentFileList) {
        content.push(currentFileList);
        currentFileList = undefined;
      }

      if (OfficialReportConclusionBlock.handles(block)) {
        content.push(...OfficialReportConclusionBlock.map(officialReportId, block, extensions));
        continue;
      }

      if (OfficialReportSectionTitleBlock.handles(block)) {
        content.push(...OfficialReportSectionTitleBlock.map(block));
        continue;
      }

      if (OfficialReportSectionIntroBlock.handles(block)) {
        content.push(...OfficialReportSectionIntroBlock.map(block, extensions));
        continue;
      }
    }

    return assertNever(block);
  }

  if (currentFileList) content.push(currentFileList);

  return { content, type: 'doc' };
}
