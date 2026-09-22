import Button from '@codegouvfr/react-dsfr/Button';
import { EditorContent, EditorContext, useEditorState, type Editor } from '@tiptap/react';
import clsx from 'clsx';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { BoldButton, ItalicButton, RedoButton, UndoButton } from '@/shared/ui/tip-tap-editor';
import { Tooltip } from '@/shared/ui/tooltip';

import { DOCUMENT_CONTENT_CLASSES } from './document-content';
import './blocks/doc-block.css';

export function DocumentBlocksEditor(props: {
  editor: Editor;
  otherBlockNames?: readonly string[];
  onPendingRevalidationChange?: (pending: { others: number; propositions: number }) => void;
  propositionBlockName: string;
  onPreview: () => Promise<unknown>;
  previewDisabledReason?: string;
}) {
  const { editor, otherBlockNames, previewDisabledReason, propositionBlockName } = props;

  const others = useMemo(() => new Set(otherBlockNames), [otherBlockNames]);
  const pendingRevalidations = useEditorState({
    editor,
    selector: ({ editor }): { others: number; propositions: number } => {
      const pending = { others: 0, propositions: 0 };
      editor?.state.doc.descendants((node) => {
        if (!node.attrs.outdated) return true;
        if (node.type.name === propositionBlockName) pending.propositions += 1;
        else if (others.has(node.type.name)) pending.others += 1;

        return true;
      });
      return pending;
    },
    equalityFn: (a, b) => a.others === b?.others && a.propositions === b?.propositions,
  });

  const { onPendingRevalidationChange } = props;
  useEffect(() => {
    onPendingRevalidationChange?.(pendingRevalidations);
  }, [onPendingRevalidationChange, pendingRevalidations]);

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
        <div className="fr-p-2v sticky top-[calc(var(--fondation-banner-height)+var(--document-bar-offset))] z-10 flex items-center gap-2 border-x-0 border-t-0 border-b border-solid border-(--border-default-grey) bg-(--background-default-grey)">
          <BoldButton />
          <ItalicButton />
          <div className="fr-mx-1v w-px self-stretch bg-(--border-default-grey)" />
          <UndoButton />
          <RedoButton />
          <Tooltip className="ml-auto" focusable={!!previewDisabledReason} label={previewDisabledReason}>
            <Button
              // a disabled button swallows the pointer, and the tooltip would never open
              className={clsx({ 'pointer-events-none': !!previewDisabledReason })}
              disabled={isPersisting || !!previewDisabledReason}
              iconId="fr-icon-eye-line"
              iconPosition="right"
              onClick={preview}
              priority="tertiary no outline"
              size="small"
            >
              <FormattedMessage defaultMessage="Retour à l'aperçu" />
            </Button>
          </Tooltip>
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
