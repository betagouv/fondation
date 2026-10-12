import { useCurrentEditor, useEditorState } from '@tiptap/react';

import type { HeadingLevel } from '../extensions/constant';

import { EditorButton } from './EditorButton';

type HeadingButtonProps = {
  level: HeadingLevel;
};

export function HeadingButton({ level }: HeadingButtonProps) {
  const { editor } = useCurrentEditor();
  const disabled = useEditorState({
    editor,
    selector: (ctx) => !ctx.editor || !ctx.editor.can().toggleHeading({ level }),
  });

  const toggleHeading = () => {
    if (!editor) return;
    editor.chain().focus().toggleHeading({ level }).run();
  };

  return (
    <EditorButton
      attributes={{ level }}
      disabled={!!disabled}
      iconId={`fr-icon-h-${level}`}
      mark="heading"
      onClick={toggleHeading}
      title={`H${level}`}
    />
  );
}
