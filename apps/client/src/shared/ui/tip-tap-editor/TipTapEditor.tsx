import { EditorContent, EditorContext, useEditor, type EditorContextValue } from '@tiptap/react';
import clsx from 'clsx';
import { useCallback, useMemo, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { useDebouncedCallback } from 'use-debounce';

import { useBeforeUnloadOrUnmount } from '@/shared/hooks/useBeforeUnload';

import type { FilesUploader } from './extensions/editor-file-uploader';
import { useTipTapExtensions } from './extensions/useTipTapExtensions';
import { MenuBar } from './MenuBar';

type TipTapEditorProps = {
  ariaLabelledby: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  uploadFiles?: FilesUploader;
  value: string | undefined;
};

export const TipTapEditor = ({
  ariaLabelledby,
  onChange,
  readOnly,
  uploadFiles,
  value,
}: TipTapEditorProps) => {
  const extensions = useTipTapExtensions({ uploadFiles });

  const onChangeDebounced = useDebouncedCallback((next: string) => onChange?.(next), 2_000);
  const [html, setHtml] = useState<string>(value ?? '');
  const onUpdate = useCallback(
    (value: string) => {
      setHtml(value);
      onChangeDebounced(value);
    },
    [setHtml, onChangeDebounced],
  );

  const isDirty = useMemo(() => value !== html, [value, html]);

  const editor = useEditor({
    content: value,
    editable: !readOnly,
    editorProps: { attributes: { 'aria-labelledby': ariaLabelledby } },
    extensions,
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML());
    },
  });

  useBeforeUnloadOrUnmount(() => {
    onChangeDebounced.flush();
  });

  const providerValue = useMemo((): EditorContextValue => ({ editor }), [editor]);

  return (
    <EditorContext.Provider value={providerValue}>
      <div className="fr-p-4v bg-(--background-default-grey)">
        {!readOnly && <MenuBar />}
        <EditorContent editor={editor} />
        {!readOnly && (
          <div
            aria-live="polite"
            className={clsx(
              "fr-p-2v flex items-center text-xs before:mr-1 before:size-4! before:content-['']",
              {
                'ri-loop-left-line': isDirty,
                'fr-icon-success-line': !isDirty,
              },
            )}
          >
            {isDirty ? (
              <FormattedMessage defaultMessage="Enregistrement…" />
            ) : (
              <FormattedMessage defaultMessage="Enregistré" />
            )}
          </div>
        )}
      </div>
    </EditorContext.Provider>
  );
};
