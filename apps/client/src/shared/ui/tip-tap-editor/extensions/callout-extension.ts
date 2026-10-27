import { mergeAttributes, Node } from '@tiptap/core';
import { Fragment, type Node as ProseMirrorNode, type NodeType, Slice } from '@tiptap/pm/model';
import { Plugin } from '@tiptap/pm/state';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    callout: {
      toggleCallout: () => ReturnType;
    };
  }
}

const NOTION_OPENING = /^<aside>\s*(.*)$/s;
const NOTION_CLOSING = /^<\/aside>$/;
const ONLY_PICTOGRAMS = /^(?:\p{Extended_Pictographic}[\uFE0F\u200D\p{Emoji_Modifier}]*|\s)+$/u;

/** Notion pastes a callout as the text of its markdown: an `<aside>` paragraph, the content, a `</aside>` paragraph */
export function wrapNotionCallouts(content: Fragment, callout: NodeType): Fragment | null {
  const { schema } = callout;
  const nodes: ProseMirrorNode[] = [];
  let inside: ProseMirrorNode[] | null = null;

  const isBlank = (node: ProseMirrorNode) => node.type.name === 'paragraph' && node.content.size === 0;
  const close = () => {
    if (inside === null) return;
    // Notion surrounds the content of its callout with blank lines, which would pad the block
    while (inside[0] && isBlank(inside[0])) inside.shift();
    while (inside.at(-1) && isBlank(inside.at(-1)!)) inside.pop();
    nodes.push(callout.create(null, inside.length > 0 ? inside : [schema.nodes['paragraph']!.create()]));
    inside = null;
  };

  content.forEach((node) => {
    const text = node.textContent.trim();

    if (inside === null) {
      const opening = node.type.name === 'paragraph' ? NOTION_OPENING.exec(text) : null;
      if (!opening) {
        nodes.push(node);
        return;
      }

      inside = [];
      // the pictogram of a Notion callout is its icon, which the DSFR callout brings on its own
      const remainder = opening[1]!.trim();
      if (remainder && !ONLY_PICTOGRAMS.test(remainder)) {
        inside.push(schema.nodes['paragraph']!.create(null, schema.text(remainder)));
      }
    } else if (NOTION_CLOSING.test(text)) {
      close();
    } else {
      inside.push(node);
    }
  });
  close();

  return nodes.length === content.childCount ? null : Fragment.from(nodes);
}

/** the "à savoir" block of a help page, stored as an aside and shown as the DSFR callout */
export const Callout = Node.create({
  content: 'block+',
  defining: true,
  group: 'block',
  name: 'callout',

  addCommands() {
    return {
      toggleCallout:
        () =>
        ({ commands }) =>
          commands.toggleWrap(this.name),
    };
  },

  addProseMirrorPlugins() {
    const callout = this.type;

    return [
      new Plugin({
        props: {
          transformPasted: (slice) => {
            const wrapped = wrapNotionCallouts(slice.content, callout);
            return wrapped ? new Slice(wrapped, 0, 0) : slice;
          },
        },
      }),
    ];
  },

  parseHTML() {
    return [{ tag: 'aside' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['aside', mergeAttributes(HTMLAttributes, { class: 'fr-callout fr-icon-lightbulb-line' }), 0];
  },
});
