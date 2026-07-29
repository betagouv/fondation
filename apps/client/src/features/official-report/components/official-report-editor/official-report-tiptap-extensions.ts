import { Extension, type AnyExtension, type Command, type Editor } from '@tiptap/core';
import Bold from '@tiptap/extension-bold';
import BulletList from '@tiptap/extension-bullet-list';
import Document from '@tiptap/extension-document';
import Italic from '@tiptap/extension-italic';
import ListItem from '@tiptap/extension-list-item';
import OrderedList from '@tiptap/extension-ordered-list';
import { Paragraph } from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import { UndoRedo } from '@tiptap/extensions';
import type { ReactNodeViewProps } from '@tiptap/react';

import type { OfficialReportBlocksModel } from './blocks/official-report-blocks.model';
import { OfficialReportConclusionBlockNode } from './blocks/OfficialReportConclusionBlock';
import { OfficialReportFileBlockNode, OfficialReportFileListNode } from './blocks/OfficialReportFileBlock';
import { OfficialReportIntroBlockNode } from './blocks/OfficialReportIntroBlock';
import { OfficialReportSectionIntroBlockNode } from './blocks/OfficialReportSectionIntroBlock';
import { OfficialReportSectionTitleBlockNode } from './blocks/OfficialReportSectionTitleBlock';

const OfficialReportModelExtension = Extension.create<{ model: OfficialReportBlocksModel | null }>({
  name: 'officialReportModel',
  addOptions: () => ({ model: null }),
  addCommands() {
    const { model } = this.options;
    return {
      resetBlock:
        (viewProps: ReactNodeViewProps) =>
        ({ editor }) => {
          // without queueMicrotask, tiptap throws
          queueMicrotask(() => void model?.resetBlock({ ...viewProps, editor }));
          return true;
        },

      acknowledgeBlock:
        (viewProps: ReactNodeViewProps) =>
        ({ editor }) => {
          // without queueMicrotask, tiptap throws
          queueMicrotask(() => void model?.acknowledgeBlock({ ...viewProps, editor }));
          return true;
        },
    };
  },
});

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    officialReportModel: {
      resetBlock: (viewProps: ReactNodeViewProps) => ReturnType;
      acknowledgeBlock: (viewProps: ReactNodeViewProps) => ReturnType;
    };
  }
}

/**
 * Undo/redo restore the block content *and* its `outdated` attribute (tracked by
 * prosemirror-history). `onHistory` lets the model re-persist the restored state so the
 * backend `outdated` flag follows the editor.
 */
const OfficialReportUndoRedo = UndoRedo.extend<{ onHistory: ((editor: Editor) => Promise<void>) | null }>({
  addOptions() {
    return { ...this.parent?.(), onHistory: null };
  },
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
      undo: wrap(parent?.undo),
      redo: wrap(parent?.redo),
    };
  },
});

export function buildOfficialReportExtensions(model: OfficialReportBlocksModel): AnyExtension[] {
  return [
    Document,
    Paragraph,
    Text,
    Bold,
    Italic,
    BulletList,
    ListItem,
    OrderedList,
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
