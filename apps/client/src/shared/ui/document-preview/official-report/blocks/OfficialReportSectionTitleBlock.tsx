import type { Node as PMNode } from '@tiptap/pm/model';
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

import {
  useBlockActive,
  type BlockDescriptor,
  type OfficialReportBlock,
  type OfficialReportBlockOptions,
  type OfficialReportMutations,
} from '../utils';

type JsonOfficialReportSectionTitleBlock = Extract<OfficialReportBlock, { kind: 'section-title' }>;
export const OfficialReportSectionTitleBlock = {
  block: 'section-title' satisfies OfficialReportBlock['kind'],
  name: 'sectionTitleBlock',

  handles(block: OfficialReportBlock): block is JsonOfficialReportSectionTitleBlock {
    return block.kind === this.block;
  },

  attrsOf(block: JsonOfficialReportSectionTitleBlock) {
    return { outcome: block.outcome, edited: block.edited };
  },

  map(block: JsonOfficialReportSectionTitleBlock): JSONContent[] {
    return [
      {
        type: this.name,
        attrs: this.attrsOf(block),
        content: [{ type: 'text', text: block.text }],
      },
    ];
  },

  nodeKey: (node: PMNode) => (node.attrs.outcome ? `section-title:${node.attrs.outcome}` : null),
  serialize: (node: PMNode) => node.textContent,
  save(node: PMNode, content: string, mutations: OfficialReportMutations) {
    mutations.editSectionTitle.mutate({ outcome: node.attrs.outcome, text: content });
  },
} satisfies BlockDescriptor;

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

export const OfficialReportSectionTitleBlockNode = Node.create<OfficialReportBlockOptions>({
  name: OfficialReportSectionTitleBlock.name,
  group: 'block',
  content: 'inline*',
  marks: '',
  isolating: true,
  selectable: true,
  addOptions() {
    return { callbacks: null };
  },
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
