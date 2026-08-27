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
import { DocBlockEditedBadge } from '@/features/documents/components/blocks/DocBlockEditedBadge';
import { useBlockActive } from '@/features/documents/components/blocks/useBlockActive';

import { type AgendaBlock } from './agenda-blocks.type';

type JsonAgendaFileBlock = Extract<AgendaBlock, { kind: 'file' }>;
export const AgendaFileBlock = {
  block: 'file' satisfies AgendaBlock['kind'],
  name: 'agendaFileBlock',

  handles(block: AgendaBlock): block is JsonAgendaFileBlock {
    return block.kind === this.block;
  },

  map(agendaId: string, block: JsonAgendaFileBlock, extensions: AnyExtension[]): JSONContent[] {
    return [
      {
        type: this.name,
        attrs: {
          isPending: false,
          agendaId,
          fileId: block.id,
          edited: block.edited,
          outdated: block.outdated,
          generatedHtml: block.generatedHtml ?? null,
        },
        content: toInlineContent(block.html, extensions),
      },
    ];
  },
};

/** The block only stores inline content; parse the `<p>` wrapper away to keep the inline nodes. */
function toInlineContent(html: string, extensions: AnyExtension[]): JSONContent[] {
  const doc = generateJSON(`<p>${html}</p>`, extensions) as JSONContent;
  return doc.content?.flatMap((node) => node.content ?? []) ?? [];
}

function FileBlockView(props: ReactNodeViewProps) {
  const { edited, outdated } = props.node.attrs;
  const active = useBlockActive(props);

  return (
    <NodeViewWrapper
      as="div"
      data-block-type="file"
      className={clsx('doc-block', {
        'doc-block--active': active,
        'doc-block--warning': edited || outdated,
      })}
    >
      {edited && <DocBlockEditedBadge />}

      <NodeViewContent<'p'> as="p" />

      <DocBlockDriftBanner {...props} />
    </NodeViewWrapper>
  );
}

export const AgendaFileBlockNode = Node.create({
  name: AgendaFileBlock.name,
  group: 'block',
  content: 'inline*',
  marks: 'bold italic',
  isolating: true,
  selectable: false,
  priority: 200,

  addAttributes: () => ({
    isPending: { default: false, rendered: false },
    edited: { default: false, rendered: false },
    outdated: { default: false },
    fileId: { default: null },
    generatedHtml: { default: null, rendered: false },
    agendaId: { default: null, rendered: false },
  }),

  parseHTML: () => [{ tag: 'p[data-block-type="file"]' }],

  renderHTML: ({ HTMLAttributes }) =>
    // oxfmt-ignore
    ['p', mergeAttributes(HTMLAttributes, { 'data-block-type': 'file' }), 0],

  addNodeView: () => ReactNodeViewRenderer(FileBlockView, { selectedOnTextSelection: true }),
});
