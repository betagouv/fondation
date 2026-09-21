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
        attrs: {
          agendaId,
          edited: block.edited,
          editedAt: block.editedAt,
          fileId: block.id,
          generatedHtml: block.generatedHtml ?? null,
          isPending: false,
          outdated: block.outdated,
        },
        content: toInlineContent(block.html, extensions),
        type: this.name,
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
  const { edited, editedAt, outdated } = props.node.attrs;
  const active = useBlockActive(props);

  return (
    <NodeViewWrapper
      as="div"
      className={clsx('doc-block', {
        // the blue tint marks a block still untouched: an edited one shows its own words instead
        'doc-block--active': active && !edited,
        'doc-block--edited': edited,
        'doc-block--warning': outdated,
      })}
      data-block-type="file"
    >
      {edited && <DocBlockEditedBadge editedAt={editedAt} />}

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
    agendaId: { default: null, rendered: false },
    edited: { default: false, rendered: false },
    editedAt: { default: null, rendered: false },
    fileId: { default: null },
    generatedHtml: { default: null, rendered: false },
    isPending: { default: false, rendered: false },
    outdated: { default: false },
  }),

  parseHTML: () => [{ tag: 'p[data-block-type="file"]' }],

  renderHTML: ({ HTMLAttributes }) =>
    // oxfmt-ignore
    ['p', mergeAttributes(HTMLAttributes, { 'data-block-type': 'file' }), 0],

  addNodeView: () => ReactNodeViewRenderer(FileBlockView, { selectedOnTextSelection: true }),
});
