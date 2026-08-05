import Button from '@codegouvfr/react-dsfr/Button';
import { EditorContent, EditorContext, useEditorState } from '@tiptap/react';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { generatePath, useNavigate } from 'react-router';

import '@/shared/ui/document-preview/DocumentEditor.css';
import '@/shared/ui/doc-block-editor/doc-block.css';
import { BoldButton } from '@/shared/ui/tip-tap-editor/buttons/BoldButton';
import { ItalicButton } from '@/shared/ui/tip-tap-editor/buttons/ItalicButton';
import { RedoButton } from '@/shared/ui/tip-tap-editor/buttons/RedoButton';
import { UndoButton } from '@/shared/ui/tip-tap-editor/buttons/UndoButton';
import { ROUTE_PATHS } from '@/utils/route-path.utils';

import { AgendaBlocksModel } from './blocks/agenda-blocks.model';
import type { AgendaBlock } from './blocks/agenda-blocks.type';
import { AgendaFileBlock } from './blocks/AgendaFileBlock';
import { useAgendaEditor } from './hooks/useAgendaEditor';

export function AgendaDocumentEditor(props: {
  sessionId: string;
  agendaId: string;
  blocks: readonly AgendaBlock[];
  onPendingRevalidationChange?: (pending: boolean) => void;
}) {
  const navigate = useNavigate();

  const [model] = React.useState(
    () => new AgendaBlocksModel({ agendaId: props.agendaId, blocks: props.blocks }),
  );
  const editor = useAgendaEditor(model);

  const hasPendingRevalidation = useEditorState({
    editor,
    selector: ({ editor }): boolean => {
      let pending = false;
      editor?.state.doc.descendants((node) => {
        if (node.type.name === AgendaFileBlock.name && node.attrs.outdated) pending = true;
        return !pending;
      });
      return pending;
    },
  });

  const { onPendingRevalidationChange } = props;
  React.useEffect(() => {
    onPendingRevalidationChange?.(hasPendingRevalidation);
  }, [hasPendingRevalidation, onPendingRevalidationChange]);

  const [isPersisting, setIsPersisting] = React.useState(false);
  const preview = React.useCallback(async () => {
    try {
      setIsPersisting(true);
      await model.onEditorUpdate(editor);
      return navigate(
        generatePath(ROUTE_PATHS.SG.AGENDA_RENDER, {
          sessionId: props.sessionId,
          agendaId: model.agendaId,
        }),
      );
    } finally {
      setIsPersisting(false);
    }
  }, [model, props.sessionId, editor, navigate, setIsPersisting]);

  return (
    <div className="mx-auto max-w-3xl rounded border border-solid border-(--border-default-grey) bg-(--background-default-grey)">
      <EditorContext value={{ editor }}>
        <div className="fr-p-2v sticky top-0 z-10 flex items-center gap-2 border-x-0 border-t-0 border-b border-solid border-(--border-default-grey) bg-(--background-default-grey)">
          <BoldButton />
          <ItalicButton />
          <div className="fr-mx-1v w-px self-stretch bg-(--border-default-grey)" />
          <UndoButton />
          <RedoButton />
          <Button
            disabled={isPersisting}
            className="ml-auto"
            size="small"
            priority="tertiary no outline"
            iconId="fr-icon-eye-line"
            iconPosition="right"
            onClick={preview}
          >
            <FormattedMessage defaultMessage="Aperçu" />
          </Button>
        </div>
      </EditorContext>

      <EditorContent
        editor={editor}
        disabled={isPersisting}
        className="fr-p-4v h-[calc(100%-49px)] min-h-100 overflow-auto [&_.tiptap]:outline-none"
      />
    </div>
  );
}
