import { Extension, type AnyExtension, type Command, type Editor } from '@tiptap/core';
import Bold from '@tiptap/extension-bold';
import BulletList from '@tiptap/extension-bullet-list';
import Document from '@tiptap/extension-document';
import HardBreak from '@tiptap/extension-hard-break';
import Italic from '@tiptap/extension-italic';
import ListItem from '@tiptap/extension-list-item';
import OrderedList from '@tiptap/extension-ordered-list';
import { Paragraph } from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import { UndoRedo } from '@tiptap/extensions';
import type { ReactNodeViewProps } from '@tiptap/react';

import { changedWords } from '@/features/documents/components/blocks/changed-words';

import type { OfficialReportBlocksModel } from './blocks/official-report-blocks.model';
import {
  OfficialReportConclusionBlock,
  OfficialReportConclusionBlockNode,
} from './blocks/OfficialReportConclusionBlock';
import {
  OfficialReportFileBlock,
  OfficialReportFileBlockNode,
  OfficialReportFileListNode,
} from './blocks/OfficialReportFileBlock';
import { OfficialReportIntroBlock, OfficialReportIntroBlockNode } from './blocks/OfficialReportIntroBlock';
import { OfficialReportSectionIntroBlockNode } from './blocks/OfficialReportSectionIntroBlock';
import { OfficialReportSectionTitleBlockNode } from './blocks/OfficialReportSectionTitleBlock';

const OfficialReportModelExtension = Extension.create<{ model: OfficialReportBlocksModel | null }>({
  addCommands() {
    const { model } = this.options;
    return {
      acknowledgeBlock:
        (viewProps: ReactNodeViewProps) =>
        ({ editor }) => {
          // without queueMicrotask, tiptap throws
          queueMicrotask(() => void model?.acknowledgeBlock({ ...viewProps, editor }));
          return true;
        },

      resetBlock:
        (viewProps: ReactNodeViewProps) =>
        ({ editor }) => {
          // without queueMicrotask, tiptap throws
          queueMicrotask(() => void model?.resetBlock({ ...viewProps, editor }));
          return true;
        },
    };
  },
  addOptions: () => ({ model: null }),
  name: 'officialReportModel',
});

/**
 * Undo/redo restore the block content *and* its `outdated` attribute (tracked by
 * prosemirror-history). `onHistory` lets the model restage the restored state so the
 * backend `outdated` flag follows the editor.
 */
const OfficialReportUndoRedo = UndoRedo.extend<{ onHistory: ((editor: Editor) => void) | null }>({
  addCommands() {
    const parent = this.parent?.();
    type CommandFn = () => Command;
    const wrap =
      (command: CommandFn | undefined): CommandFn =>
      () =>
      (props) => {
        const ran = command?.()(props) ?? false;
        if (ran && props.dispatch) this.options.onHistory?.(props.editor);
        return ran;
      };

    return {
      ...parent,
      redo: wrap(parent?.redo),
      undo: wrap(parent?.undo),
    };
  },
  addOptions() {
    return { ...this.parent?.(), onHistory: null };
  },
});

export function buildOfficialReportExtensions(model: OfficialReportBlocksModel): AnyExtension[] {
  return [
    Document,
    Paragraph,
    Text,
    Bold,
    Italic,
    HardBreak,
    BulletList,
    ListItem,
    OrderedList,
    changedWords({
      blocks: [
        OfficialReportIntroBlock.name,
        OfficialReportFileBlock.name,
        OfficialReportConclusionBlock.name,
      ],
      name: 'officialReportChangedWords',
    }),
    OfficialReportModelExtension.configure({ model }),
    OfficialReportUndoRedo.configure({ onHistory: (editor) => model.onEditorUpdate(editor) }),
    OfficialReportIntroBlockNode,
    OfficialReportConclusionBlockNode,
    OfficialReportSectionTitleBlockNode,
    OfficialReportFileBlockNode,
    OfficialReportFileListNode,
    OfficialReportSectionIntroBlockNode,
  ];
}
