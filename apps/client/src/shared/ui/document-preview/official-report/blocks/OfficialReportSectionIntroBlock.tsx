import { generateJSON, mergeAttributes, type AnyExtension, type JSONContent } from '@tiptap/core';
import type { Node as PMNode, Schema } from '@tiptap/pm/model';
import {
  Node,
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type ReactNodeViewProps,
} from '@tiptap/react';
import clsx from 'clsx';

import {
  serializeContent,
  useBlockActive,
  type BlockDescriptor,
  type OfficialReportBlock,
  type OfficialReportBlockOptions,
  type OfficialReportMutations,
} from '../utils';

type JsonOfficialReportSectionIntroBlock = Extract<OfficialReportBlock, { kind: 'section-intro' }>;
export const OfficialReportSectionIntroBlock = {
  block: 'section-intro' satisfies OfficialReportBlock['kind'],
  name: 'sectionIntroBlock',

  handles(block: OfficialReportBlock): block is JsonOfficialReportSectionIntroBlock {
    return block.kind === this.block;
  },

  attrsOf(block: JsonOfficialReportSectionIntroBlock) {
    return { outcome: block.outcome, edited: block.edited };
  },

  map(block: JsonOfficialReportSectionIntroBlock, extensions: AnyExtension[]): JSONContent[] {
    return [
      {
        type: this.name,
        attrs: this.attrsOf(block),
        content: generateJSON(block.html, extensions).content ?? [],
      },
    ];
  },

  nodeKey: (node: PMNode) => (node.attrs.outcome ? `section-intro:${node.attrs.outcome}` : null),
  serialize: (node: PMNode, schema: Schema) => serializeContent(node, schema),
  save(node: PMNode, content: string, mutations: OfficialReportMutations) {
    mutations.editSectionIntro.mutate({ html: content, outcome: node.attrs.outcome });
  },
} satisfies BlockDescriptor;

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

export const OfficialReportSectionIntroBlockNode = Node.create<OfficialReportBlockOptions>({
  name: OfficialReportSectionIntroBlock.name,
  group: 'block',
  content: 'block*',
  marks: 'bold italic',
  isolating: true,
  selectable: true,

  addOptions: () => ({ callbacks: null }),
  addAttributes: () => ({ outcome: { default: null }, edited: { default: false, rendered: false } }),
  parseHTML: () => [{ tag: 'div[data-block-type="section-intro"]' }],
  renderHTML: ({ HTMLAttributes }) =>
    // oxfmt-ignore
    ['div', mergeAttributes(HTMLAttributes, { 'data-block-type': 'section-intro'}), 0],

  addNodeView: () => ReactNodeViewRenderer(SectionIntroBlockView, { selectedOnTextSelection: true }),
});
