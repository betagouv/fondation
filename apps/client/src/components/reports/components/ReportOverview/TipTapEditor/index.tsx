import { EditorContent, EditorContext, useEditor, type EditorContextValue } from '@tiptap/react';
import clsx from 'clsx';
import React from 'react';
import { useDebouncedCallback } from 'use-debounce';

import { useBeforeUnloadOrUnmount } from '@/hooks/useBeforeUnload';

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

  const onChangeDebounced = useDebouncedCallback(onChange, 2_000);
  const [html, setHtml] = React.useState<string>(value ?? '');
  const onUpdate = React.useCallback(
    (value: string) => {
      setHtml(value);
      onChangeDebounced(value);
    },
    [setHtml, onChangeDebounced],
  );

  const isDirty = React.useMemo(() => value !== html, [value, html]);

  const editor = useEditor({
    content: value,
    extensions,
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML());
    },
  });

  useBeforeUnloadOrUnmount(() => {
    onChangeDebounced.flush();
  });

  const providerValue = React.useMemo((): EditorContextValue => ({ editor }), [editor]);

  return (
    <EditorContext.Provider value={providerValue}>
      <div className="tiptap-editor-wrapper">
        <MenuBar />
        <EditorContent editor={editor} />
        <div
          className={clsx("flex items-center p-2 text-xs before:mr-1 before:size-4! before:content-['']", {
            'ri-loop-left-line': isDirty,
            'fr-icon-success-line': !isDirty,
          })}
        >
          {isDirty ? `Enregistrement…` : `Enregistré`}
        </div>
      </div>
    </EditorContext.Provider>
  );
};
