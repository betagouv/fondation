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

import { OfficialReportDriftBanner } from '../components/OfficialReportDriftBanner';
import { OfficialReportEditedBadge } from '../components/OfficialReportEditedBadge';
import { useBlockActive } from '../hooks/useBlockActive';

import { type OfficialReportBlock } from './official-report-blocks.type';

type JsonOfficialReportConclusionBlock = Extract<OfficialReportBlock, { kind: 'conclusion' }>;
export const OfficialReportConclusionBlock = {
  block: 'conclusion' satisfies OfficialReportBlock['kind'],
  name: 'conclusionBlock',

  handles(block: OfficialReportBlock): block is JsonOfficialReportConclusionBlock {
    return block.kind === this.block;
  },

  map(
    officialReportId: string,
    block: JsonOfficialReportConclusionBlock,
    extensions: AnyExtension[],
  ): JSONContent[] {
    return [
      {
        type: this.name,
        attrs: {
          isPending: false,
          officialReportId,
          edited: block.edited,
          outdated: block.outdated,
          generatedHtml: block.generatedHtml,
        },
        content: generateJSON(block.html, extensions).content ?? [],
      },
    ];
  },
};

function ConclusionBlockView(props: ReactNodeViewProps) {
  const { edited } = props.node.attrs;
  const active = useBlockActive(props);

  return (
    <NodeViewWrapper
      as="div"
      className={clsx('doc-block doc-block--conclusion', {
        'doc-block--active': active,
        'doc-block--warning': edited,
      })}
    >
      {edited && <OfficialReportEditedBadge />}

      <NodeViewContent />
      <OfficialReportDriftBanner {...props} />
    </NodeViewWrapper>
  );
}

export const OfficialReportConclusionBlockNode = Node.create({
  name: OfficialReportConclusionBlock.name,
  group: 'block',
  content: 'block*',
  isolating: true,
  selectable: false,

  addAttributes: () => ({
    outdated: { default: false },
    isPending: { default: false, rendered: false },
    edited: { default: false, rendered: false },
    generatedHtml: { default: null, rendered: false },
    officialReportId: { default: null, rendered: false },
  }),

  parseHTML() {
    return [{ tag: 'div[data-block-type="conclusion"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-block-type': 'conclusion' }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ConclusionBlockView, { selectedOnTextSelection: true });
  },
});
