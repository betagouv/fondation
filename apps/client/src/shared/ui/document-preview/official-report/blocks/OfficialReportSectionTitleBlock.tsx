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

import { useBlockActive } from '../hooks/useBlockActive';

import { type OfficialReportBlock } from './official-report-blocks.type';

type JsonOfficialReportSectionTitleBlock = Extract<OfficialReportBlock, { kind: 'section-title' }>;
export const OfficialReportSectionTitleBlock = {
  block: 'section-title' satisfies OfficialReportBlock['kind'],
  name: 'sectionTitleBlock',

  handles(block: OfficialReportBlock): block is JsonOfficialReportSectionTitleBlock {
    return block.kind === this.block;
  },

  map(block: JsonOfficialReportSectionTitleBlock): JSONContent[] {
    return [
      {
        type: this.name,
        attrs: { outcome: block.outcome, edited: block.edited },
        content: [{ type: 'text', text: block.text }],
      },
    ];
  },
};

function SectionTitleBlockView(props: ReactNodeViewProps) {
  const active = useBlockActive(props);
  return (
    <NodeViewWrapper
      as="h2"
      className={clsx('doc-block doc-block--title', {
        'doc-block--active': active,
        'doc-block--warning': props.node.attrs.edited,
      })}
    >
      <NodeViewContent<'span'> as="span" />
    </NodeViewWrapper>
  );
}

export const OfficialReportSectionTitleBlockNode = Node.create({
  name: OfficialReportSectionTitleBlock.name,
  group: 'block',
  content: 'inline*',
  marks: '',
  isolating: true,
  selectable: true,
  addAttributes() {
    return { outcome: { default: null }, edited: { default: false, rendered: false } };
  },
  parseHTML() {
    return [{ tag: 'h2[data-block-type="section-title"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['h2', mergeAttributes(HTMLAttributes, { 'data-block-type': 'section-title' }), 0];
  },
  addKeyboardShortcuts() {
    return { Enter: () => this.editor.isActive('sectionTitleBlock') };
  },
  addNodeView() {
    return ReactNodeViewRenderer(SectionTitleBlockView, { selectedOnTextSelection: true });
  },
});
