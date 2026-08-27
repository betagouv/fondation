import Bold from '@tiptap/extension-bold';
import Document from '@tiptap/extension-document';
import Heading from '@tiptap/extension-heading';
import Italic from '@tiptap/extension-italic';
import { BulletList, ListItem, OrderedList } from '@tiptap/extension-list';
import { Paragraph } from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import { UndoRedo } from '@tiptap/extensions';
import { EditorContent, EditorContext, useEditor } from '@tiptap/react';
import clsx from 'clsx';
import { useCallback, useMemo } from 'react';
import { useDebouncedCallback } from 'use-debounce';

import {
  BoldButton,
  BulletListButton,
  ItalicButton,
  RedoButton,
  UndoButton,
} from '@/shared/ui/tip-tap-editor';

import { DOCUMENT_CONTENT_CLASSES } from './document-content';

function extractEditableContent(html: string | undefined | null): string {
  const doc = new DOMParser().parseFromString(html ?? '', 'text/html');
  return doc.querySelector('[data-editable-content]')?.innerHTML ?? '';
}

function useContentReinjector(originalHtml: string | undefined | null) {
  const parsedDoc = useMemo(
    () => new DOMParser().parseFromString(originalHtml ?? '', 'text/html'),
    [originalHtml],
  );

  return useCallback(
    (updatedContent: string) => {
      const editableNode = parsedDoc.querySelector('[data-editable-content]');
      if (editableNode) editableNode.innerHTML = updatedContent;
      return `<!doctype html>${parsedDoc.documentElement.outerHTML}`;
    },
    [parsedDoc],
  );
}

export function DocumentHtmlEditor(props: {
  title: string;
  html: string | undefined | null;
  onHtmlChange: (fullHtml: string) => void;
}) {
  const reinjectContent = useContentReinjector(props.html);
  const debouncedOnChange = useDebouncedCallback(props.onHtmlChange, 600);

  const editor = useEditor({
    content: extractEditableContent(props.html),
    extensions: [
      Document,
      Paragraph,
      Text,
      Bold,
      Italic,
      UndoRedo,
      BulletList,
      ListItem,
      Heading,
      OrderedList,
    ],
    onUpdate: ({ editor }) => {
      debouncedOnChange(reinjectContent(editor.getHTML()));
    },
  });

  return (
    <div className="mx-auto max-w-3xl rounded border border-solid border-(--border-default-grey) bg-(--background-default-grey)">
      <EditorContext value={{ editor }}>
        <div className="fr-p-2v sticky top-0 z-10 flex items-center gap-2 border-x-0 border-t-0 border-b border-solid border-(--border-default-grey) bg-(--background-default-grey)">
          <BoldButton />
          <ItalicButton />
          <BulletListButton />
          <div className="fr-mx-1v w-px self-stretch bg-(--border-default-grey)" />
          <UndoButton />
          <RedoButton />
        </div>
      </EditorContext>

      <EditorContent
        editor={editor}
        className={clsx('fr-p-4v min-h-100 [&_.tiptap]:outline-none', DOCUMENT_CONTENT_CLASSES)}
      />
    </div>
  );
}
