import Button from '@codegouvfr/react-dsfr/Button';
import {
  generateJSON,
  mergeAttributes,
  Node,
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type AnyExtension,
  type JSONContent,
  type ReactNodeViewProps,
} from '@tiptap/react';
import clsx from 'clsx';
import { FormattedMessage } from 'react-intl';
import { generatePath, useLocation, useParams } from 'react-router';

import { DocBlockDriftBanner } from '@/features/documents/components/blocks/DocBlockDriftBanner';
import { DocBlockEditedBadge } from '@/features/documents/components/blocks/DocBlockEditedBadge';
import { ROUTE_PATHS } from '@/utils/route-path.utils';

import { type OfficialReportBlock } from './official-report-blocks.type';
import { OfficialReportFileNote } from './OfficialReportFileNote';

type JsonOfficialReportFileBlock = Extract<OfficialReportBlock, { kind: 'file' }>;
export const OfficialReportFileBlock = {
  block: 'file' satisfies OfficialReportBlock['kind'],
  name: 'fileBlock',

  handles(block: OfficialReportBlock): block is JsonOfficialReportFileBlock {
    return block.kind === this.block;
  },

  map(
    officialReportId: string,
    block: JsonOfficialReportFileBlock,
    extensions: AnyExtension[],
  ): JSONContent[] {
    return [
      {
        type: this.name,
        attrs: {
          agendaEditedAt: block.agendaEditedAt,
          agendaEditedBy: block.agendaEditedBy,
          agendaHtml: block.agendaHtml,
          agendaId: block.agendaId,
          edited: block.edited,
          editedAt: block.editedAt,
          editedBy: block.editedBy,
          fromAgenda: block.fromAgenda,
          generatedHtml: block.generatedHtml,
          isPending: false,
          nominationFileId: block.nominationFileId,
          note: block.note,
          officialReportId,
          outdated: block.outdated,
        },
        content: generateJSON(block.html, extensions).content,
      },
    ];
  },
};

function FileBlockView(props: ReactNodeViewProps) {
  const {
    agendaEditedAt,
    agendaEditedBy,
    agendaId,
    edited,
    editedAt,
    editedBy,
    fromAgenda,
    nominationFileId,
    note,
    officialReportId,
    outdated,
  } = props.node.attrs;
  const { sessionId } = useParams<{ sessionId: string }>();
  const { pathname } = useLocation();

  const agendaAction = agendaId && sessionId && (
    <Button
      iconId="fr-icon-edit-line"
      iconPosition="right"
      linkProps={{
        state: { officialReportPath: pathname },
        to: generatePath(ROUTE_PATHS.SG.AGENDA_EDIT, { agendaId, sessionId }),
      }}
      priority="tertiary no outline"
      size="small"
    >
      <FormattedMessage defaultMessage="Corriger le bloc dans l'ODJ" />
    </Button>
  );

  return (
    <NodeViewWrapper
      className={clsx('doc-block doc-block--file', {
        'doc-block--warning': outdated && nominationFileId,
      })}
      data-block-type="file"
    >
      <div className={clsx('doc-block__read-only', { 'doc-block--edited': edited })} contentEditable={false}>
        {edited && (
          <DocBlockEditedBadge
            agendaEditedAt={agendaEditedAt}
            agendaEditedBy={agendaEditedBy}
            editedAt={editedAt}
            editedBy={editedBy}
            fromAgenda={fromAgenda}
            place="officialReport"
          />
        )}

        <NodeViewContent contentEditable={false} />
      </div>

      {nominationFileId && officialReportId && sessionId ? (
        <OfficialReportFileNote
          agendaAction={agendaAction}
          nominationFileId={nominationFileId}
          note={note}
          officialReportId={officialReportId}
          onStored={(stored) => {
            const pos = props.getPos();
            if (pos == null) return;

            // the note is already stored: undoing the report's text must not bring an older one back
            props.editor.view.dispatch(
              props.editor.state.tr.setNodeAttribute(pos, 'note', stored).setMeta('addToHistory', false),
            );
          }}
          sessionId={sessionId}
        />
      ) : (
        agendaAction && (
          <div className="flex justify-end" contentEditable={false}>
            {agendaAction}
          </div>
        )
      )}

      <DocBlockDriftBanner {...props} acknowledgeable={false} />
    </NodeViewWrapper>
  );
}

export const OfficialReportFileBlockNode = Node.create({
  name: OfficialReportFileBlock.name,
  content: 'block*',
  marks: 'bold italic',
  isolating: true,
  selectable: false,
  draggable: false,
  addAttributes: () => ({
    agendaEditedAt: { default: null, rendered: false },
    agendaEditedBy: { default: null, rendered: false },
    agendaHtml: { default: null, rendered: false },
    agendaId: { default: null, rendered: false },
    edited: { default: false, rendered: false },
    editedAt: { default: null, rendered: false },
    editedBy: { default: null, rendered: false },
    fromAgenda: { default: false, rendered: false },
    generatedHtml: { default: null, rendered: false },
    isPending: { default: false, rendered: false },
    nominationFileId: { default: null },
    note: { default: null, rendered: false },
    officialReportId: { default: null, rendered: false },
    outdated: { default: false },
  }),
  parseHTML: () => [{ tag: 'fon-block-file' }],
  renderHTML: ({ HTMLAttributes }) =>
    // oxfmt-ignore
    ['fon-block-file', mergeAttributes(HTMLAttributes), 0],

  addNodeView: () => ReactNodeViewRenderer(FileBlockView, { selectedOnTextSelection: true, as: 'li' }),
});

/** Ordered container for the file blocks — a valid `fileBlock+` parent so undo/redo stay schema-valid. */
export const OfficialReportFileListNode = Node.create({
  name: 'fileListBlock',
  group: 'block',
  content: 'fileBlock+',
  parseHTML: () => [{ tag: 'ol[data-block-type="file-list"]' }],
  renderHTML: ({ HTMLAttributes }) =>
    // oxfmt-ignore
    ['ol', mergeAttributes(HTMLAttributes, { 'data-block-type': 'file-list', class: 'doc-block__file-list' }), 0],
});
