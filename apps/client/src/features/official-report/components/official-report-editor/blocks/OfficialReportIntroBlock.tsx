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

function IntroBlockView(props: ReactNodeViewProps) {
  const { edited, outdated } = props.node.attrs;
  const active = useBlockActive(props);

  return (
    <NodeViewWrapper
      as="div"
      className={clsx('doc-block', {
        'doc-block--active': active,
        'doc-block--warning': edited || outdated,
      })}
    >
      {edited && <OfficialReportEditedBadge />}

      <NodeViewContent />

      <OfficialReportDriftBanner {...props} />
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
    isPending: { default: false, rendered: false },
    edited: { default: false, rendered: false },
    outdated: { default: false },
    generatedHtml: { default: null, rendered: false },
    officialReportId: { default: null, rendered: false },
  }),

  parseHTML: () => [{ tag: 'div[data-block-type="intro"]' }],

  renderHTML: ({ HTMLAttributes }) =>
    // oxfmt-ignore
    ['div', mergeAttributes(HTMLAttributes, { 'data-block-type': 'intro' }), 0],

  addNodeView: () => ReactNodeViewRenderer(IntroBlockView, { selectedOnTextSelection: true }),
});
