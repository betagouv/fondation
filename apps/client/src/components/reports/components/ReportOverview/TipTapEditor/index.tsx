import { EditorContent, EditorContext, useEditor, type EditorContextValue } from '@tiptap/react';
import React from 'react';
import { useDebouncedCallback } from 'use-debounce';

import type { FilesUploader } from './extensions/editor-file-uploader';
import { useTipTapExtensions } from './extensions/useTipTapExtensions';
import { MenuBar } from './MenuBar';

type TipTapEditorProps = {
  value: string | undefined;
  onChange: (value: string) => void;
  ariaLabelledby: string;
  uploadFiles?: FilesUploader;
};

export const TipTapEditor = ({ value, onChange, uploadFiles }: TipTapEditorProps) => {
  const extensions = useTipTapExtensions({ uploadFiles });

  const onChangeDebounced = useDebouncedCallback(onChange, 600);
  const editor = useEditor({
    content: value,
    extensions,
    onUpdate: ({ editor }) => {
      onChangeDebounced(editor.getHTML());
    }
  });

  const providerValue = React.useMemo((): EditorContextValue => ({ editor }), [editor]);

  return (
    <EditorContext.Provider value={providerValue}>
      <div className="tiptap-editor-wrapper">
        <MenuBar />
        <EditorContent editor={editor} />
      </div>
    </EditorContext.Provider>
  );
};
