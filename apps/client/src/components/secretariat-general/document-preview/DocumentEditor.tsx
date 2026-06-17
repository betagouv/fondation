import Bold from '@tiptap/extension-bold';
import Document from '@tiptap/extension-document';
import Heading from '@tiptap/extension-heading';
import Italic from '@tiptap/extension-italic';
import { BulletList, ListItem, OrderedList } from '@tiptap/extension-list';
import { Paragraph } from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import { UndoRedo } from '@tiptap/extensions';
import { EditorContent, EditorContext, useEditor } from '@tiptap/react';
import React from 'react';
import { useDebouncedCallback } from 'use-debounce';

import './DocumentEditor.css';

import { BoldButton } from '@/components/reports/components/ReportOverview/TipTapEditor/buttons/BoldButton';
import { BulletListButton } from '@/components/reports/components/ReportOverview/TipTapEditor/buttons/BulletListButton';
import { ItalicButton } from '@/components/reports/components/ReportOverview/TipTapEditor/buttons/ItalicButton';
import { RedoButton } from '@/components/reports/components/ReportOverview/TipTapEditor/buttons/RedoButton';
import { UndoButton } from '@/components/reports/components/ReportOverview/TipTapEditor/buttons/UndoButton';

function extractEditableContent(html: string | undefined | null): string {
  const doc = new DOMParser().parseFromString(html ?? '', 'text/html');
  return doc.querySelector('[data-editable-content]')?.innerHTML ?? '';
}

function useContentReinjector(originalHtml: string | undefined | null) {
  const parsedDoc = React.useMemo(
    () => new DOMParser().parseFromString(originalHtml ?? '', 'text/html'),
    [originalHtml],
  );

  return React.useCallback(
    (updatedContent: string) => {
      const editableNode = parsedDoc.querySelector('[data-editable-content]');
      if (editableNode) editableNode.innerHTML = updatedContent;
      return `<!doctype html>${parsedDoc.documentElement.outerHTML}`;
    },
    [parsedDoc],
  );
}

export function DocumentEditor(props: {
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
    <div className="mx-auto max-w-3xl rounded border border-solid border-gray-200 bg-white">
      <EditorContext value={{ editor }}>
        <div className="fr-p-2v sticky top-0 z-10 flex items-center gap-2 border-x-0 border-t-0 border-b border-solid border-gray-200 bg-white">
          <BoldButton />
          <ItalicButton />
          <BulletListButton />
          <div className="fr-mx-1v w-px self-stretch bg-gray-200" />
          <UndoButton />
          <RedoButton />
        </div>
      </EditorContext>

      <EditorContent editor={editor} className="fr-p-4v min-h-100 [&_.tiptap]:outline-none" />
    </div>
  );
}
