import {
  mergeAttributes,
  Node,
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type JSONContent,
  type ReactNodeViewProps,
} from '@tiptap/react';
import clsx from 'clsx';

import { useBlockActive } from '@/features/documents/components/blocks/useBlockActive';

import { type OfficialReportBlock } from './official-report-blocks.type';

type JsonOfficialReportSectionTitleBlock = Extract<OfficialReportBlock, { kind: 'section-title' }>;
export const OfficialReportSectionTitleBlock = {
  block: 'section-title' satisfies OfficialReportBlock['kind'],

  handles(block: OfficialReportBlock): block is JsonOfficialReportSectionTitleBlock {
    return block.kind === this.block;
  },

  map(block: JsonOfficialReportSectionTitleBlock): JSONContent[] {
    return [
      {
        attrs: { edited: block.edited, outcome: block.outcome },
        content: [{ text: block.text, type: 'text' }],
        type: this.name,
      },
    ];
  },

  name: 'sectionTitleBlock',
};

function SectionTitleBlockView(props: ReactNodeViewProps) {
  const active = useBlockActive(props);
  return (
    <NodeViewWrapper
      as="h2"
      className={clsx('doc-block doc-block--title', {
        'doc-block--active': active && !props.node.attrs.edited,
        'doc-block--edited': props.node.attrs.edited,
      })}
    >
      <NodeViewContent<'span'> as="span" />
    </NodeViewWrapper>
  );
}

export const OfficialReportSectionTitleBlockNode = Node.create({
  addAttributes() {
    return {
      edited: { default: false, rendered: false },
      outcome: { default: null },
    };
  },
  addKeyboardShortcuts() {
    return { Enter: () => this.editor.isActive('sectionTitleBlock') };
  },
  addNodeView() {
    return ReactNodeViewRenderer(SectionTitleBlockView, { selectedOnTextSelection: true });
  },
  content: 'text*',
  group: 'block',
  isolating: true,
  marks: '',
  name: OfficialReportSectionTitleBlock.name,
  parseHTML() {
    return [{ tag: 'h2[data-block-type="section-title"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['h2', mergeAttributes(HTMLAttributes, { 'data-block-type': 'section-title' }), 0];
  },
  selectable: true,
});
