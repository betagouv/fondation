import Button from '@codegouvfr/react-dsfr/Button';
import { EditorContent, EditorContext } from '@tiptap/react';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { generatePath, useNavigate } from 'react-router';

import './blocks.css';

import { BoldButton } from '@/shared/ui/tip-tap-editor/buttons/BoldButton';
import { ItalicButton } from '@/shared/ui/tip-tap-editor/buttons/ItalicButton';
import { RedoButton } from '@/shared/ui/tip-tap-editor/buttons/RedoButton';
import { UndoButton } from '@/shared/ui/tip-tap-editor/buttons/UndoButton';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import '../DocumentEditor.css';

import type { OfficialReportBlock } from './blocks/official-report-blocks.type';
import { useOfficialReportEditor } from './hooks/useOfficialReportEditor';

export function OfficialReportDocumentEditor(props: { sessionId: string; model: OfficialReport }) {
  const navigate = useNavigate();
  const editor = useOfficialReportEditor(props.model);

  const [isPersisting, setIsPersisting] = React.useState(false);
  const preview = React.useCallback(async () => {
    try {
      setIsPersisting(true);
      await props.model.onEditorUpdate(editor);
      return navigate(
        generatePath(ROUTE_PATHS.SG.OFFICIAL_REPORT_RENDER, {
          sessionId: props.sessionId,
          officialReportId: props.model.officialReportId,
        }),
      );
    } finally {
      setIsPersisting(false);
    }
  }, [props, editor, navigate, setIsPersisting]);

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
