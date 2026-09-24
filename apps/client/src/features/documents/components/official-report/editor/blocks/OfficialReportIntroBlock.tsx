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
import { useBlockActive } from '@/features/documents/components/blocks/useBlockActive';

import { type OfficialReportBlock } from './official-report-blocks.type';

type JsonOfficialReportIntroBlock = Extract<OfficialReportBlock, { kind: 'intro' }>;
export const OfficialReportIntroBlock = {
  block: 'intro' satisfies OfficialReportBlock['kind'],
  name: 'introBlock',

  handles(block: OfficialReportBlock): block is JsonOfficialReportIntroBlock {
    return block.kind === this.block;
  },

  map(
    officialReportId: string,
    block: JsonOfficialReportIntroBlock,
    extensions: AnyExtension[],
  ): JSONContent[] {
    return [
      {
        type: this.name,
        attrs: {
          edited: block.edited,
          generatedHtml: block.generatedHtml,
          isPending: false,
          officialReportId,
          outdated: block.outdated,
        },
        content: generateJSON(block.html, extensions).content ?? [],
      },
    ];
  },
};

function IntroBlockView(props: ReactNodeViewProps) {
  const { edited, outdated } = props.node.attrs;
  const active = useBlockActive(props);

  return (
    <NodeViewWrapper
      as="div"
      className={clsx('doc-block', {
        'doc-block--active': active && !edited,
        'doc-block--edited': edited,
        'doc-block--warning': outdated,
      })}
    >
      <NodeViewContent />

      <DocBlockDriftBanner {...props} />
    </NodeViewWrapper>
  );
}

export const OfficialReportIntroBlockNode = Node.create({
  name: OfficialReportIntroBlock.name,
  group: 'block',
  content: 'block*',
  isolating: true,
  selectable: false,

  addAttributes: () => ({
    edited: { default: false, rendered: false },
    generatedHtml: { default: null, rendered: false },
    isPending: { default: false, rendered: false },
    officialReportId: { default: null, rendered: false },
    outdated: { default: false },
  }),

  parseHTML: () => [{ tag: 'div[data-block-type="intro"]' }],

  renderHTML: ({ HTMLAttributes }) =>
    // oxfmt-ignore
    ['div', mergeAttributes(HTMLAttributes, { 'data-block-type': 'intro' }), 0],

  addNodeView: () => ReactNodeViewRenderer(IntroBlockView, { selectedOnTextSelection: true }),
});
