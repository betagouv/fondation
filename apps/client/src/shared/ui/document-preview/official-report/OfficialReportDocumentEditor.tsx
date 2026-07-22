import Button from '@codegouvfr/react-dsfr/Button';
import { EditorContent, EditorContext, useEditor } from '@tiptap/react';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { generatePath, useNavigate } from 'react-router';

import './blocks.css';

import { useDebouncedCallback } from 'use-debounce';

import { BoldButton } from '@/shared/ui/tip-tap-editor/buttons/BoldButton';
import { ItalicButton } from '@/shared/ui/tip-tap-editor/buttons/ItalicButton';
import { RedoButton } from '@/shared/ui/tip-tap-editor/buttons/RedoButton';
import { UndoButton } from '@/shared/ui/tip-tap-editor/buttons/UndoButton';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { useOfficialReportBlockMutations } from '@queries/agenda.queries';
import '../DocumentEditor.css';

import { OfficialReportModel } from './official-report.model';
import { OfficialReportViewModel } from './official-report.view-model';
import type { OfficialReportBlock, OfficialReportBlockCallbacks } from './utils';

export function OfficialReportDocumentEditor(props: {
  sessionId: string;
  officialReportId: string;
  blocks: OfficialReportBlock[];
}) {
  const navigate = useNavigate();
  const mutations = useOfficialReportBlockMutations(props.officialReportId);
  const mutationsRef = React.useRef(mutations);
  mutationsRef.current = mutations;
  const modelRef = React.useRef<OfficialReportModel | null>(null);

  const callbacks = React.useMemo<OfficialReportBlockCallbacks>(
    () => ({
      editIntro: () => modelRef.current?.editIntro(),
      resetIntro: () => modelRef.current?.resetIntro(),
      editConclusion: () => modelRef.current?.editConclusion(),
      resetConclusion: () => modelRef.current?.resetConclusion(),
      keepFile: (id) => modelRef.current?.keepFile(id),
      resetFile: (id) => modelRef.current?.resetFile(id),
      onHistory: () => modelRef.current?.persist(),
    }),
    [],
  );

  const viewModel = React.useMemo(() => new OfficialReportViewModel(callbacks), [callbacks]);

  const persist = useDebouncedCallback(() => modelRef.current?.persist(), 600);

  const editor = useEditor({
    extensions: viewModel.extensions,
    content: viewModel.buildDoc(props.blocks),
    onUpdate: () => persist(),
  });

  if (modelRef.current) modelRef.current.mutations = mutations;

  const onPreview = React.useCallback(
    () =>
      navigate(
        generatePath(ROUTE_PATHS.SG.OFFICIAL_REPORT_RENDER, {
          sessionId: props.sessionId,
          officialReportId: props.officialReportId,
        }),
      ),
    [props.sessionId, props.officialReportId, navigate],
  );

  React.useEffect(() => {
    if (!editor) return;
    const model = new OfficialReportModel(editor, mutationsRef.current, viewModel);
    model.captureSynced();
    modelRef.current = model;
  }, [editor, viewModel]);

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
            className="ml-auto"
            size="small"
            priority="tertiary no outline"
            iconId="fr-icon-eye-line"
            iconPosition="right"
            onClick={() => {
              modelRef.current?.persist();
              onPreview();
            }}
          >
            <FormattedMessage defaultMessage="Aperçu" />
          </Button>
        </div>
      </EditorContext>

      <EditorContent
        editor={editor}
        className="fr-p-4v h-[calc(100%-49px)] min-h-100 overflow-auto [&_.tiptap]:outline-none"
      />
    </div>
  );
}
