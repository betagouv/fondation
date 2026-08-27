import Button from '@codegouvfr/react-dsfr/Button';
import { EditorContent, EditorContext, useEditorState, type Editor } from '@tiptap/react';
import clsx from 'clsx';
import { useCallback, useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { BoldButton, ItalicButton, RedoButton, UndoButton } from '@/shared/ui/tip-tap-editor';

import { DOCUMENT_CONTENT_CLASSES } from './document-content';
import './blocks/doc-block.css';

export function DocumentBlocksEditor(props: {
  blockName: string;
  editor: Editor;
  onPendingRevalidationChange?: (pending: boolean) => void;
  onPreview: () => Promise<unknown>;
}) {
  const { blockName, editor } = props;

  const hasPendingRevalidation = useEditorState({
    editor,
    selector: ({ editor }): boolean => {
      let pending = false;
      editor?.state.doc.descendants((node) => {
        if (node.type.name === blockName && node.attrs.outdated) pending = true;
        return !pending;
      });
      return pending;
    },
  });

  const { onPendingRevalidationChange } = props;
  useEffect(() => {
    onPendingRevalidationChange?.(hasPendingRevalidation);
  }, [hasPendingRevalidation, onPendingRevalidationChange]);

  const [isPersisting, setIsPersisting] = useState(false);
  const { onPreview } = props;
  const preview = useCallback(async () => {
    try {
      setIsPersisting(true);
      await onPreview();
    } finally {
      setIsPersisting(false);
    }
  }, [onPreview]);

  return (
    <div className="mx-auto w-full max-w-3xl rounded border border-solid border-(--border-default-grey) bg-(--background-default-grey)">
      <EditorContext value={{ editor }}>
        <div className="fr-p-2v sticky top-(--document-bar-offset) z-10 flex items-center gap-2 border-x-0 border-t-0 border-b border-solid border-(--border-default-grey) bg-(--background-default-grey)">
          <BoldButton />
          <ItalicButton />
          <div className="fr-mx-1v w-px self-stretch bg-(--border-default-grey)" />
          <UndoButton />
          <RedoButton />
          <Button
            className="ml-auto"
            disabled={isPersisting}
            iconId="fr-icon-eye-line"
            iconPosition="right"
            onClick={preview}
            priority="tertiary no outline"
            size="small"
          >
            <FormattedMessage defaultMessage="Aperçu" />
          </Button>
        </div>
      </EditorContext>
      <EditorContent
        editor={editor}
        disabled={isPersisting}
        className={clsx('fr-p-4v [&_.tiptap]:outline-none', DOCUMENT_CONTENT_CLASSES)}
      />
    </div>
  );
}
