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

import { DocBlockDriftBanner, DocBlockEditedBadge, useBlockActive } from '@/shared/ui/doc-block-editor';

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
          edited: block.edited,
          outdated: block.outdated,
          generatedHtml: block.generatedHtml,
        },
        content: generateJSON(block.html, extensions).content,
      },
    ];
  },
};

function FileBlockView(props: ReactNodeViewProps) {
  const { edited, outdated, nominationFileId } = props.node.attrs;
  const active = useBlockActive(props);

  return (
    <NodeViewWrapper
      data-block-type="file"
      className={clsx('doc-block doc-block--file', {
        'doc-block--active': active,
        'doc-block--warning': (edited || outdated) && nominationFileId,
      })}
    >
      {edited && <DocBlockEditedBadge />}

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
    edited: { default: false, rendered: false },
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
