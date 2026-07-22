import type { Node as PMNode, Schema } from '@tiptap/pm/model';
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

import { OfficialReportDriftBanner } from '../OfficialReportDriftBanner';
import {
  callbacksOf,
  serializeContent,
  useBlockActive,
  type BlockDescriptor,
  type OfficialReportBlock,
  type OfficialReportBlockOptions,
  type OfficialReportMutations,
} from '../utils';

type JsonOfficialReportConclusionBlock = Extract<OfficialReportBlock, { kind: 'conclusion' }>;
export const OfficialReportConclusionBlock = {
  block: 'conclusion' satisfies OfficialReportBlock['kind'],
  name: 'conclusionBlock',

  handles(block: OfficialReportBlock): block is JsonOfficialReportConclusionBlock {
    return block.kind === this.block;
  },

  attrsOf(block: JsonOfficialReportConclusionBlock) {
    return { edited: block.edited, outdated: block.outdated, generatedHtml: block.generatedHtml };
  },

  map(block: JsonOfficialReportConclusionBlock, extensions: AnyExtension[]): JSONContent[] {
    return [
      {
        type: this.name,
        attrs: this.attrsOf(block),
        content: generateJSON(block.html, extensions).content ?? [],
      },
    ];
  },

  nodeKey: (_node: PMNode) => 'conclusion',
  serialize: (node: PMNode, schema: Schema) => serializeContent(node, schema),
  save(node: PMNode, content: string, mutations: OfficialReportMutations) {
    mutations.editConclusion.mutate({ html: content, outdated: Boolean(node.attrs.outdated) });
  },
} satisfies BlockDescriptor;

function ConclusionBlockView(props: ReactNodeViewProps) {
  const callbacks = callbacksOf(props);
  const active = useBlockActive(props);
  return (
    <NodeViewWrapper
      as="div"
      className={clsx('doc-block doc-block--conclusion', {
        'doc-block--active': active,
        'doc-block--warning': props.node.attrs.edited,
      })}
    >
      <NodeViewContent />
      {props.node.attrs.outdated && callbacks && (
        <OfficialReportDriftBanner
          onReset={callbacks.resetConclusion}
          onAcknowledge={callbacks.editConclusion}
          generatedHtml={props.node.attrs.generatedHtml}
        />
      )}
    </NodeViewWrapper>
  );
}

export const OfficialReportConclusionBlockNode = Node.create<OfficialReportBlockOptions>({
  name: OfficialReportConclusionBlock.name,
  group: 'block',
  content: 'block*',
  isolating: true,
  selectable: false,
  addOptions() {
    return { callbacks: null };
  },
  addAttributes() {
    return {
      edited: { default: false, rendered: false },
      outdated: { default: false },
      generatedHtml: { default: null, rendered: false },
    };
  },
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
