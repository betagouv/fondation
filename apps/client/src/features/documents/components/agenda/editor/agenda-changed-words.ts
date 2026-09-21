import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

import { changedRanges, removedRuns } from '@/features/documents/components/blocks/word-diff';

import { AgendaFileBlock } from './blocks/AgendaFileBlock';

function plainText(html: string): string {
  return new DOMParser().parseFromString(html, 'text/html').body.textContent ?? '';
}

/** a dropped word has left the text, so it is drawn beside it rather than within it */
function removedWord(text: string): HTMLElement {
  const word = document.createElement('del');
  word.className = 'doc-block__removed';
  word.contentEditable = 'false';
  word.textContent = text;

  return word;
}

/**
 * marks what an edited block no longer shares with the text the document proposes: its own words
 * on yellow, the dropped ones struck through beside them.
 * The block holds that proposed text in `generatedHtml`, so nothing is asked of the server.
 */
export const AgendaChangedWords = Extension.create({
  name: 'agendaChangedWords',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('agendaChangedWords'),
        props: {
          decorations({ doc }) {
            const decorations: Decoration[] = [];

            doc.descendants((node, pos) => {
              if (node.type.name !== AgendaFileBlock.name) return true;

              const generatedHtml = node.attrs.generatedHtml as string | null;
              if (!generatedHtml) return false;

              // the node opening token sits at pos, its text starts right after
              const textStart = pos + 1;
              const proposed = plainText(generatedHtml);

              for (const range of changedRanges(proposed, node.textContent)) {
                decorations.push(
                  Decoration.inline(textStart + range.from, textStart + range.to, {
                    class: 'doc-block__changed',
                  }),
                );
              }

              for (const run of removedRuns(proposed, node.textContent)) {
                decorations.push(
                  Decoration.widget(textStart + run.at, () => removedWord(run.text), {
                    ignoreSelection: true,
                    side: -1,
                  }),
                );
              }

              return false;
            });

            return DecorationSet.create(doc, decorations);
          },
        },
      }),
    ];
  },
});
