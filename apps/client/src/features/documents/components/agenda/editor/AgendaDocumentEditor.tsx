import { useCallback, useImperativeHandle, useState, type RefObject } from 'react';
import { useIntl } from 'react-intl';
import { generatePath, useNavigate } from 'react-router';

import { DocumentBlocksEditor } from '@/features/documents/components/DocumentBlocksEditor';
import { useToasts } from '@/shared/ui/toast';
import { ROUTE_PATHS } from '@/utils/route-path.utils';

import { AgendaBlocksModel, AgendaEmptied } from './blocks/agenda-blocks.model';
import type { AgendaBlock } from './blocks/agenda-blocks.type';
import { AgendaFileBlock } from './blocks/AgendaFileBlock';
import { useAgendaEditor } from './hooks/useAgendaEditor';

export type AgendaDocumentEditorHandle = {
  discard: () => void;
  save: () => Promise<{ hasRemovedPropositions: boolean }>;
};

export function AgendaDocumentEditor(props: {
  agendaId: string;
  blocks: readonly AgendaBlock[];
  handleRef?: RefObject<AgendaDocumentEditorHandle | null>;
  onDirtyChange?: (isDirty: boolean) => void;
  onPendingRevalidationChange?: (pending: boolean) => void;
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
      new AgendaBlocksModel({
        agendaId: props.agendaId,
        blocks: props.blocks,
        onDirtyChange: trackDirty,
      }),
  );
  const { editor, flushUpdates } = useAgendaEditor(model);

  // the staging is debounced: it has to run before saving, or the last keystrokes stay behind
  const save = useCallback(async () => {
    flushUpdates();
    try {
      return await model.save();
    } catch (error) {
      if (error instanceof AgendaEmptied) {
        toasts.error({
          action: {
            label: formatMessage({ defaultMessage: 'Voir les documents de la session' }),
            onClick: () => navigate(generatePath(ROUTE_PATHS.SG.SESSION_ID_DOCUMENTS, { sessionId })),
          },
          description: formatMessage({
            defaultMessage:
              'Pour le supprimer, ouvrez la liste des documents de la session. Sinon, cliquez sur Annuler les changements pour revenir au dernier enregistrement.',
          }),
          title: formatMessage({ defaultMessage: 'Un ordre du jour ne peut pas être vide' }),
        });
      }

      throw error;
    }
  }, [flushUpdates, formatMessage, model, navigate, sessionId, toasts]);

  useImperativeHandle(props.handleRef, () => ({
    discard: () => model.discard(),
    save,
  }));

  // only the save button writes to the server: leaving with pending changes is the unsaved
  // changes guard's business, which asks before anything is sent
  const onPreview = useCallback(
    async () =>
      navigate(generatePath(ROUTE_PATHS.SG.AGENDA_PREVIEW, { agendaId: model.agendaId, sessionId })),
    [model.agendaId, navigate, sessionId],
  );

  return (
    <DocumentBlocksEditor
      blockName={AgendaFileBlock.name}
      editor={editor}
      onPendingRevalidationChange={props.onPendingRevalidationChange}
      onPreview={onPreview}
      previewDisabledReason={
        isDirty
          ? formatMessage({
              defaultMessage: "Enregistrez vos changements pour accéder à l'aperçu",
            })
          : undefined
      }
    />
  );
}
