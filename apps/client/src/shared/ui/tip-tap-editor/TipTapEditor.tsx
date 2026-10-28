import { EditorContent, EditorContext, useEditor, type EditorContextValue } from '@tiptap/react';
import clsx from 'clsx';
import { type ReactNode, useCallback, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useDebouncedCallback } from 'use-debounce';

import { useBeforeUnloadOrUnmount } from '@/shared/hooks/useBeforeUnload';
import { useToasts } from '@/shared/ui/toast';

import type { EditorFeatures } from './extensions/constant';
import type { FilesUploader } from './extensions/editor-file-uploader';
import { withoutUnreachableImages } from './extensions/pasted-images';
import { useTipTapExtensions } from './extensions/useTipTapExtensions';
import { MenuBar } from './MenuBar';

type TipTapEditorProps = {
  ariaLabelledby: string;
  /** false: every change reaches `onChange` at once and the caller saves it when it decides to */
  autosave?: boolean;
  features?: EditorFeatures;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  /** what the toolbar shows at its right end, such as a way to the preview */
  toolbarEnd?: ReactNode;
  uploadFiles?: FilesUploader;
  value: string | undefined;
};

export const TipTapEditor = ({
  ariaLabelledby,
  autosave = true,
  features = 'text',
  onChange,
  readOnly,
  toolbarEnd,
  uploadFiles,
  value,
}: TipTapEditorProps) => {
  const extensions = useTipTapExtensions({ features, uploadFiles });
  const { formatMessage } = useIntl();
  const toasts = useToasts();

  const onChangeDebounced = useDebouncedCallback((next: string) => onChange?.(next), autosave ? 2_000 : 0);
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
    editorProps: {
      attributes: { 'aria-labelledby': ariaLabelledby },
      transformPastedHTML: (pasted) => {
        const { dropped, html } = withoutUnreachableImages(pasted);
        if (dropped > 0) {
          toasts.error({
            description: formatMessage({
              defaultMessage:
                'Une image copiée depuis une autre application, comme Notion, ne vient pas avec le texte. Ajoutez chaque image en collant ou en glissant le fichier lui-même.',
            }),
            title: formatMessage(
              {
                defaultMessage:
                  "{count, plural, one {Une image n'a pas été collée} other {# images n'ont pas été collées}}",
              },
              { count: dropped },
            ),
          });
        }
        return html;
      },
    },
    extensions,
    onUpdate: ({ editor }) => {
      // the ids given to the titles on creation change the document without anyone writing
      if (!editor.isInitialized) return;
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
        {!readOnly && <MenuBar end={toolbarEnd} features={features} />}
        <EditorContent editor={editor} />
        {!readOnly && autosave && (
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
