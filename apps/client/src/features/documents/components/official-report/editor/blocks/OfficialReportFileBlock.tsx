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

import { DocBlockDriftBanner } from '@/features/documents/components/blocks/DocBlockDriftBanner';
import { DocBlockEditedBadge } from '@/features/documents/components/blocks/DocBlockEditedBadge';
import { useBlockActive } from '@/features/documents/components/blocks/useBlockActive';

import { type OfficialReportBlock } from './official-report-blocks.type';

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
          isPending: false,
          officialReportId,
          nominationFileId: block.nominationFileId,
          agendaEditedAt: block.agendaEditedAt,
          agendaEditedBy: block.agendaEditedBy,
          agendaHtml: block.agendaHtml,
          edited: block.edited,
          editedAt: block.editedAt,
          editedBy: block.editedBy,
          fromAgenda: block.fromAgenda,
          outdated: block.outdated,
          generatedHtml: block.generatedHtml,
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
    edited,
    editedAt,
    editedBy,
    fromAgenda,
    outdated,
    nominationFileId,
  } = props.node.attrs;
  const active = useBlockActive(props);

  return (
    <NodeViewWrapper
      data-block-type="file"
      className={clsx('doc-block doc-block--file', {
        'doc-block--active': active && !edited,
        'doc-block--edited': edited,
        'doc-block--warning': outdated && nominationFileId,
      })}
    >
      {edited && (
        <DocBlockEditedBadge
          agendaEditedAt={agendaEditedAt}
          agendaEditedBy={agendaEditedBy}
          editedAt={editedAt}
          editedBy={editedBy}
          fromAgenda={fromAgenda}
        />
      )}

      <NodeViewContent />

      <DocBlockDriftBanner {...props} />
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
    isPending: { default: false, rendered: false },
    agendaEditedAt: { default: null, rendered: false },
    agendaEditedBy: { default: null, rendered: false },
    agendaHtml: { default: null, rendered: false },
    edited: { default: false, rendered: false },
    editedAt: { default: null, rendered: false },
    editedBy: { default: null, rendered: false },
    fromAgenda: { default: false, rendered: false },
    outdated: { default: false },
    nominationFileId: { default: null },
    generatedHtml: { default: null, rendered: false },
    officialReportId: { default: null, rendered: false },
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
