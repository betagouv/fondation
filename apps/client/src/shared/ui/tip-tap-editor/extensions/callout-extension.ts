import { mergeAttributes, Node } from '@tiptap/core';
import { Fragment, type Node as ProseMirrorNode, type NodeType, Slice } from '@tiptap/pm/model';
import { Plugin } from '@tiptap/pm/state';

const CALLOUT_KINDS = ['tip', 'warning'] as const;
export type CalloutKind = (typeof CALLOUT_KINDS)[number];

const CLASSES: Record<CalloutKind, string> = {
  tip: 'fr-callout fr-icon-lightbulb-line',
  warning: 'fr-callout fr-callout--orange-terre-battue fr-icon-warning-line',
};

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    callout: {
      toggleCallout: (props: { kind: CalloutKind; title: string }) => ReturnType;
    };
  }
}

const NOTION_OPENING = /^<aside>\s*(.*)$/s;
const NOTION_CLOSING = /^<\/aside>$/;
const ONLY_PICTOGRAMS = /^(?:\p{Extended_Pictographic}[\uFE0F\u200D\p{Emoji_Modifier}]*|\s)+$/u;
const WARNING = /^\s*(?:attention\b|[⚠🚨❗⛔])/iu;

// a callout written before the kinds, or pasted from Notion, warns when it opens on "Attention" or an alert pictogram
function kindOf(...openings: string[]): CalloutKind {
  return openings.some((opening) => WARNING.test(opening)) ? 'warning' : 'tip';
}

/** Notion pastes a callout as the text of its markdown: an `<aside>` paragraph, the content, a `</aside>` paragraph */
export function wrapNotionCallouts(content: Fragment, callout: NodeType): Fragment | null {
  const { schema } = callout;
  const nodes: ProseMirrorNode[] = [];
  let inside: ProseMirrorNode[] | null = null;
  let pictogram = '';

  const isBlank = (node: ProseMirrorNode) => node.type.name === 'paragraph' && node.content.size === 0;
  const close = () => {
    if (inside === null) return;
    // Notion surrounds the content of its callout with blank lines, which would pad the block
    while (inside[0] && isBlank(inside[0])) inside.shift();
    while (inside.at(-1) && isBlank(inside.at(-1)!)) inside.pop();
    const kind = kindOf(pictogram, inside.map((node) => node.textContent).join(' '));
    nodes.push(callout.create({ kind }, inside.length > 0 ? inside : [schema.nodes['paragraph']!.create()]));
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
      pictogram = ONLY_PICTOGRAMS.test(remainder) ? remainder : '';
      if (remainder && !pictogram) {
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

/** the "bon à savoir" or "attention" block of a help page, stored as an aside and shown as the DSFR callout */
export const Callout = Node.create({
  addAttributes() {
    return {
      kind: {
        default: 'tip',
        parseHTML: (element) =>
          CALLOUT_KINDS.find((kind) => kind === element.getAttribute('data-kind')) ??
          kindOf(element.textContent ?? ''),
        renderHTML: ({ kind }) => ({ 'data-kind': kind }),
      },
    };
  },

  addCommands() {
    return {
      toggleCallout:
        ({ kind, title }) =>
        ({ commands, dispatch, editor, tr }) => {
          if (editor.isActive(this.name, { kind })) return commands.lift(this.name);
          if (editor.isActive(this.name)) return commands.updateAttributes(this.name, { kind });
          if (!commands.wrapIn(this.name, { kind })) return false;
          if (!dispatch) return true;

          const { schema } = editor;
          const bold = schema.marks['bold'];
          const heading = schema.nodes['paragraph']!.create(
            null,
            schema.text(title, bold ? [bold.create()] : []),
          );
          const { $from } = tr.selection;
          for (let depth = $from.depth; depth > 0; depth--) {
            if ($from.node(depth).type !== this.type) continue;
            tr.insert($from.start(depth), heading);
            break;
          }
          return true;
        },
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

  content: 'block+',
  defining: true,
  group: 'block',
  name: 'callout',

  parseHTML() {
    return [{ tag: 'aside' }];
  },

  renderHTML({ HTMLAttributes, node }) {
    return [
      'aside',
      mergeAttributes(HTMLAttributes, { class: CLASSES[node.attrs['kind'] as CalloutKind] }),
      0,
    ];
  },
});
