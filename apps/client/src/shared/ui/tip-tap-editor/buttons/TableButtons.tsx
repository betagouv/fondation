import { useCurrentEditor, useEditorState } from '@tiptap/react';

import { EditorButton } from './EditorButton';

export function InsertTableButton() {
  const { editor } = useCurrentEditor();
  const disabled = useEditorState({
    editor,
    selector: (ctx) => !ctx.editor || !ctx.editor.can().insertTable(),
  });

  return (
    <EditorButton
      disabled={!!disabled}
      iconId="fr-icon-table-line"
      mark="table"
      onClick={() => editor?.chain().focus().insertTable({ cols: 3, rows: 3, withHeaderRow: true }).run()}
      title="Insérer un tableau"
    />
  );
}

export function TableRowAndColumnButtons() {
  const { editor } = useCurrentEditor();
  const isInTable = useEditorState({
    editor,
    selector: (ctx) => !!ctx.editor && ctx.editor.isActive('table'),
  });

  if (!isInTable) return null;

  return (
    <>
      <EditorButton
        disabled={false}
        iconId="ri-insert-row-bottom"
        onClick={() => editor?.chain().focus().addRowAfter().run()}
        title="Ajouter une ligne"
      />
      <EditorButton
        disabled={false}
        iconId="ri-delete-row"
        onClick={() => editor?.chain().focus().deleteRow().run()}
        title="Supprimer la ligne"
      />
      <EditorButton
        disabled={false}
        iconId="ri-insert-column-right"
        onClick={() => editor?.chain().focus().addColumnAfter().run()}
        title="Ajouter une colonne"
      />
      <EditorButton
        disabled={false}
        iconId="ri-delete-column"
        onClick={() => editor?.chain().focus().deleteColumn().run()}
        title="Supprimer la colonne"
      />
      <EditorButton
        disabled={false}
        iconId="ri-delete-bin-line"
        onClick={() => editor?.chain().focus().deleteTable().run()}
        title="Supprimer le tableau"
      />
    </>
  );
}
