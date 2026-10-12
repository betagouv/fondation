import { Editor } from '@tiptap/core';
import { afterEach, describe, expect, it } from 'vitest';

import { tipTapNodeToHtml } from '@/features/documents/components/blocks/tiptap-node-to-html';

import { agendaInlineExtensions, buildAgendaExtensions } from './agenda-tiptap-extensions';
import type { AgendaBlocksModel } from './blocks/agenda-blocks.model';
import type { AgendaBlock } from './blocks/agenda-blocks.type';
import { AgendaFileBlock } from './blocks/AgendaFileBlock';

// ProseMirror flushes the DOM after a timeout: an editor left alive fires it once jsdom is torn down
const editors: Editor[] = [];
afterEach(() => {
  for (const editor of editors.splice(0)) editor.destroy();
});

function editorWith(html: string): Editor {
  const block: AgendaBlock = {
    edited: false,
    editedAt: null,
    editedBy: null,
    generatedHtml: html,
    html,
    id: '1',
    kind: 'file',
    nominationFileId: 'nf-1',
    outdated: false,
    reporters: [],
    weight: 1,
  };
  const model = { onEditorUpdate: () => {} } as unknown as AgendaBlocksModel;

  const editor = new Editor({
    content: { content: AgendaFileBlock.map('agenda', block, agendaInlineExtensions), type: 'doc' },
    element: document.createElement('div'),
    extensions: buildAgendaExtensions(model),
  });
  editors.push(editor);
  return editor;
}

function blockHtml(editor: Editor): string {
  return tipTapNodeToHtml(editor.state.doc.firstChild!, editor.schema);
}

describe('agenda editor', () => {
  it('breaks the line within the proposition on Enter', () => {
    const editor = editorWith('<strong>Mme GAMBIN</strong>, substitute');
    editor.commands.setTextSelection(11);

    editor.commands.keyboardShortcut('Enter');

    expect(editor.state.doc.childCount).toBe(1);
    expect(blockHtml(editor)).toBe('<strong>Mme GAMBIN</strong><br>, substitute');
  });

  it('keeps the line breaks already written', () => {
    expect(blockHtml(editorWith('Mme GAMBIN<br>substitute'))).toBe('Mme GAMBIN<br>substitute');
  });
});
