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

type JsonOfficialReportIntroBlock = Extract<OfficialReportBlock, { kind: 'intro' }>;
export const OfficialReportIntroBlock = {
  block: 'intro' satisfies OfficialReportBlock['kind'],
  name: 'introBlock',

  handles(block: OfficialReportBlock): block is JsonOfficialReportIntroBlock {
    return block.kind === this.block;
  },

  attrsOf(block: JsonOfficialReportIntroBlock) {
    return { edited: block.edited, outdated: block.outdated, generatedHtml: block.generatedHtml };
  },

  map(block: JsonOfficialReportIntroBlock, extensions: AnyExtension[]): JSONContent[] {
    return [
      {
        type: this.name,
        attrs: this.attrsOf(block),
        content: generateJSON(block.html, extensions).content ?? [],
      },
    ];
  },

  nodeKey: (_node: PMNode) => 'intro',
  serialize: (node: PMNode, schema: Schema) => serializeContent(node, schema),
  save(node: PMNode, content: string, mutations: OfficialReportMutations) {
    mutations.editIntro.mutate({ html: content, outdated: Boolean(node.attrs.outdated) });
  },
} satisfies BlockDescriptor;

function IntroBlockView(props: ReactNodeViewProps) {
  const callbacks = callbacksOf(props);
  const { edited, outdated, generatedHtml } = props.node.attrs;
  const active = useBlockActive(props);
  return (
    <NodeViewWrapper
      as="div"
      className={clsx('doc-block', {
        'doc-block--active': active,
        'doc-block--warning': edited || outdated,
      })}
    >
      <NodeViewContent />
      {outdated && callbacks && (
        <OfficialReportDriftBanner
          onReset={callbacks.resetIntro}
          onAcknowledge={callbacks.editIntro}
          generatedHtml={generatedHtml}
        />
      )}
    </NodeViewWrapper>
  );
}

export const OfficialReportIntroBlockNode = Node.create<OfficialReportBlockOptions>({
  name: OfficialReportIntroBlock.name,
  group: 'block',
  content: 'block*',
  isolating: true,
  selectable: false,

  addOptions: () => ({ callbacks: null }),
  addAttributes: () => ({
    edited: { default: false, rendered: false },
    outdated: { default: false },
    generatedHtml: { default: null, rendered: false },
  }),
  parseHTML: () => [{ tag: 'div[data-block-type="intro"]' }],
  renderHTML: ({ HTMLAttributes }) =>
    // oxfmt-ignore
    ['div', mergeAttributes(HTMLAttributes, { 'data-block-type': 'intro' }), 0],

  addNodeView: () => ReactNodeViewRenderer(IntroBlockView, { selectedOnTextSelection: true }),
});
