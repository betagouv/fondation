import { generateJSON, mergeAttributes, type AnyExtension, type JSONContent } from '@tiptap/core';
import {
  Node,
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type ReactNodeViewProps,
} from '@tiptap/react';
import clsx from 'clsx';

import { useBlockActive } from '@/shared/ui/doc-block-editor';

import { type OfficialReportBlock } from './official-report-blocks.type';

type JsonOfficialReportSectionIntroBlock = Extract<OfficialReportBlock, { kind: 'section-intro' }>;
export const OfficialReportSectionIntroBlock = {
  block: 'section-intro' satisfies OfficialReportBlock['kind'],
  name: 'sectionIntroBlock',

  handles(block: OfficialReportBlock): block is JsonOfficialReportSectionIntroBlock {
    return block.kind === this.block;
  },

  map(block: JsonOfficialReportSectionIntroBlock, extensions: AnyExtension[]): JSONContent[] {
    return [
      {
        type: this.name,
        attrs: { outcome: block.outcome, edited: block.edited },
        content: generateJSON(block.html, extensions).content ?? [],
      },
    ];
  },
};

function SectionIntroBlockView(props: ReactNodeViewProps) {
  const active = useBlockActive(props);
  return (
    <NodeViewWrapper
      as="div"
      className={clsx('doc-block', {
        'doc-block--active': active,
        'doc-block--warning': props.node.attrs.edited,
      })}
    >
      <NodeViewContent />
    </NodeViewWrapper>
  );
}

export const OfficialReportSectionIntroBlockNode = Node.create({
  name: OfficialReportSectionIntroBlock.name,
  group: 'block',
  content: 'block*',
  marks: 'bold italic',
  isolating: true,
  selectable: true,

  addAttributes: () => ({
    outcome: { default: null },
    edited: { default: false, rendered: false },
  }),
  parseHTML: () => [{ tag: 'div[data-block-type="section-intro"]' }],
  renderHTML: ({ HTMLAttributes }) =>
    // oxfmt-ignore
    ['div', mergeAttributes(HTMLAttributes, { 'data-block-type': 'section-intro'}), 0],

  addNodeView: () => ReactNodeViewRenderer(SectionIntroBlockView, { selectedOnTextSelection: true }),
});
