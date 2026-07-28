import type { AnyExtension, Command, Editor } from '@tiptap/core';
import Bold from '@tiptap/extension-bold';
import BulletList from '@tiptap/extension-bullet-list';
import Document from '@tiptap/extension-document';
import Italic from '@tiptap/extension-italic';
import ListItem from '@tiptap/extension-list-item';
import OrderedList from '@tiptap/extension-ordered-list';
import { Paragraph } from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import { UndoRedo } from '@tiptap/extensions';

import { OfficialReportConclusionBlockNode } from '../blocks/OfficialReportConclusionBlock';
import { OfficialReportFileBlockNode, OfficialReportFileListNode } from '../blocks/OfficialReportFileBlock';
import { OfficialReportIntroBlockNode } from '../blocks/OfficialReportIntroBlock';
import { OfficialReportSectionIntroBlockNode } from '../blocks/OfficialReportSectionIntroBlock';
import { OfficialReportSectionTitleBlockNode } from '../blocks/OfficialReportSectionTitleBlock';

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

export function buildOfficialReportExtensions(callbacks: {
  onHistory: (editor: Editor) => Promise<void>;
}): AnyExtension[] {
  return [
    Document,
    Paragraph,
    Text,
    Bold,
    Italic,
    BulletList,
    ListItem,
    OrderedList,
    OfficialReportUndoRedo.configure({ onHistory: callbacks.onHistory }),
    OfficialReportIntroBlockNode,
    OfficialReportConclusionBlockNode,
    OfficialReportSectionTitleBlockNode,
    OfficialReportFileBlockNode,
    OfficialReportFileListNode,
    OfficialReportSectionIntroBlockNode,
  ];
}
