import { useCallback, useImperativeHandle, useState, type RefObject } from 'react';
import { defineMessage, useIntl, type IntlShape, type MessageDescriptor } from 'react-intl';
import { generatePath, useNavigate } from 'react-router';

import { plainText } from '@/features/documents/components/blocks/proposed-text';
import { DocumentBlocksEditor } from '@/features/documents/components/DocumentBlocksEditor';
import { useToasts } from '@/shared/ui/toast';
import { ROUTE_PATHS } from '@/utils/route-path.utils';

import './blocks.css';
import {
  OfficialReportBlockEmptied,
  OfficialReportBlocksModel,
  type OfficialReportEditionBlockState,
} from './blocks/official-report-blocks.model';
import type { OfficialReportBlock } from './blocks/official-report-blocks.type';
import { OfficialReportConclusionBlock } from './blocks/OfficialReportConclusionBlock';
import { OfficialReportFileBlock } from './blocks/OfficialReportFileBlock';
import { OfficialReportIntroBlock } from './blocks/OfficialReportIntroBlock';
import { useOfficialReportEditor } from './hooks/useOfficialReportEditor';

const EMPTIED_PART: Record<OfficialReportEditionBlockState['kind'], MessageDescriptor> = {
  conclusion: defineMessage({ defaultMessage: 'La conclusion est vide' }),
  file: defineMessage({ defaultMessage: 'Une proposition est vide' }),
  intro: defineMessage({ defaultMessage: "L'introduction est vide" }),
  'section-intro': defineMessage({ defaultMessage: "Le texte d'une section est vide" }),
  'section-title': defineMessage({ defaultMessage: 'Un titre de section est vide' }),
};

const NAMED_PROPOSITION = defineMessage({ defaultMessage: '{sentence} : cette proposition est vide' });

const EMPTIED_TOAST = 'official-report-block-emptied';

const OTHER_DRIFTING_BLOCKS = [OfficialReportIntroBlock.name, OfficialReportConclusionBlock.name];

function emptiedPartOf(
  error: OfficialReportBlockEmptied,
  stored: readonly OfficialReportBlock[],
  formatMessage: IntlShape['formatMessage'],
): string {
  const { emptied } = error;

  if (emptied.kind === 'file') {
    const held = stored.find(
      (block) => block.kind === 'file' && block.nominationFileId === emptied.nominationFileId,
    );
    const sentence = held && 'html' in held ? plainText(held.html).trim() : '';

    if (sentence) {
      const name = sentence.split(',')[0]!.trim();
      return formatMessage(NAMED_PROPOSITION, {
        sentence: name.length > 48 ? `${name.slice(0, 48)}…` : name,
      });
    }
  }

  return formatMessage(EMPTIED_PART[emptied.kind]);
}

export type OfficialReportDocumentEditorHandle = {
  discard: () => void;
  save: () => Promise<void>;
};

export function OfficialReportDocumentEditor(props: {
  blocks: readonly OfficialReportBlock[];
  handleRef?: RefObject<OfficialReportDocumentEditorHandle | null>;
  officialReportId: string;
  onDirtyChange?: (isDirty: boolean) => void;
  onPendingRevalidationChange?: (pending: { others: number; propositions: number }) => void;
  sessionId: string;
}) {
  const navigate = useNavigate();
  const toasts = useToasts();
  const { formatMessage } = useIntl();

  const { onDirtyChange, sessionId } = props;
  const [isDirty, setIsDirty] = useState(false);
  const trackDirty = useCallback(
    (dirty: boolean) => {
      setIsDirty(dirty);
      onDirtyChange?.(dirty);
    },
    [onDirtyChange],
  );

  const [model] = useState(
    () =>
      new OfficialReportBlocksModel({
        blocks: props.blocks,
        officialReportId: props.officialReportId,
        onDirtyChange: trackDirty,
      }),
  );
  const { editor, flushUpdates } = useOfficialReportEditor(model);

  // the staging is debounced: it has to run before saving, or the last keystrokes stay behind
  const save = useCallback(async () => {
    flushUpdates();
    try {
      await model.save();
      toasts.close(EMPTIED_TOAST);
    } catch (error) {
      if (error instanceof OfficialReportBlockEmptied) {
        toasts.error({
          description: formatMessage({
            defaultMessage:
              'Écrivez son texte ou cliquez sur Annuler les changements pour revenir au dernier enregistrement.',
          }),
          id: EMPTIED_TOAST,
          title: emptiedPartOf(error, props.blocks, formatMessage),
        });
      }

      throw error;
    }
  }, [flushUpdates, formatMessage, model, props.blocks, toasts]);

  useImperativeHandle(props.handleRef, () => ({
    discard: () => {
      toasts.close(EMPTIED_TOAST);
      model.discard();
    },
    save,
  }));

  // only the save button writes to the server: leaving with pending changes is the unsaved
  // changes guard's business, which asks before anything is sent
  const onPreview = useCallback(
    async () =>
      navigate(
        generatePath(ROUTE_PATHS.SG.OFFICIAL_REPORT_PREVIEW, {
          officialReportId: model.officialReportId,
          sessionId,
        }),
      ),
    [model.officialReportId, navigate, sessionId],
  );

  return (
    <DocumentBlocksEditor
      otherBlockNames={OTHER_DRIFTING_BLOCKS}
      propositionBlockName={OfficialReportFileBlock.name}
      editor={editor}
      onPendingRevalidationChange={props.onPendingRevalidationChange}
      onPreview={onPreview}
      previewDisabledReason={
        isDirty
          ? formatMessage({ defaultMessage: "Enregistrez vos changements pour accéder à l'aperçu" })
          : undefined
      }
    />
  );
}
