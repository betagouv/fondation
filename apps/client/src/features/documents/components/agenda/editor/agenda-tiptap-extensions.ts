import { Extension, type AnyExtension, type Command, type Editor } from '@tiptap/core';
import Bold from '@tiptap/extension-bold';
import Document from '@tiptap/extension-document';
import Italic from '@tiptap/extension-italic';
import { Paragraph } from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import { UndoRedo } from '@tiptap/extensions';
import type { ReactNodeViewProps } from '@tiptap/react';

import type { AgendaBlocksModel } from './blocks/agenda-blocks.model';
import { AgendaFileBlockNode } from './blocks/AgendaFileBlock';

const AgendaModelExtension = Extension.create<{ model: AgendaBlocksModel | null }>({
  name: 'agendaModel',
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

/**
 * Undo/redo restore the block content *and* its `outdated` attribute (tracked by
 * prosemirror-history). `onHistory` lets the model re-persist the restored state so the
 * backend `outdated` flag follows the editor.
 */
const AgendaUndoRedo = UndoRedo.extend<{ onHistory: ((editor: Editor) => Promise<void>) | null }>({
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

/** Minimal schema used to parse a block's inline html into inline nodes. */
export const agendaInlineExtensions: AnyExtension[] = [Document, Paragraph, Text, Bold, Italic];

export function buildAgendaExtensions(model: AgendaBlocksModel): AnyExtension[] {
  return [
    Document.extend({ content: 'agendaFileBlock+' }),
    Text,
    Bold,
    Italic,
    AgendaModelExtension.configure({ model }),
    AgendaUndoRedo.configure({ onHistory: (editor) => model.onEditorUpdate(editor) }),
    AgendaFileBlockNode,
  ];
}
