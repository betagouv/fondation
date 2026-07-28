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

import { useBlockActive } from '../hooks/useBlockActive';
import { OfficialReportDriftBanner } from '../OfficialReportDriftBanner';
import {
  useOfficialReportBlockIntroEditMutation,
  useOfficialReportBlockIntroResetMutation,
} from '@queries/agenda.queries';

import { type OfficialReportBlock } from './official-report-blocks.type';
import { tipTapNodeToHtml } from './tiptap-node-to-html';

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
  const { edited, outdated, generatedHtml, officialReportId } = props.node.attrs;
  const active = useBlockActive(props);

  const { mutate: resetIntro } = useOfficialReportBlockIntroResetMutation(officialReportId);
  const onReset = () =>
    resetIntro(undefined, {
      onSuccess() {
        props.updateAttributes({ ...props.node.attrs, outdated: false });

        const pos = props.getPos();
        if (pos == null) return;
        props.editor.commands.insertContentAt(
          { from: pos + 1, to: pos + props.node.nodeSize - 1 },
          generatedHtml,
        );
      },
    });

  const { mutate: editIntro } = useOfficialReportBlockIntroEditMutation(officialReportId);
  const onAcknowledge = () => {
    const html = tipTapNodeToHtml(props.node, props.editor.schema);
    editIntro(
      { html, outdated: false },
      {
        onSuccess() {
          props.updateAttributes({ ...props.node.attrs, outdated: false });
        },
      },
    );
  };

  return (
    <NodeViewWrapper
      as="div"
      className={clsx('doc-block', {
        'doc-block--active': active,
        'doc-block--warning': edited || outdated,
      })}
    >
      <NodeViewContent />
      {outdated && (
        <OfficialReportDriftBanner
          onReset={onReset}
          onAcknowledge={onAcknowledge}
          generatedHtml={generatedHtml}
        />
      )}
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
