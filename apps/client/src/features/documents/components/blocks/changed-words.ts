import { Extension, type AnyExtension } from '@tiptap/core';
import type { Node as PMNode } from '@tiptap/pm/model';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

import { changedRanges, plainText, removedRuns } from './proposed-text';

/** a dropped word has left the text, so it is drawn beside it rather than within it */
function removedWord(text: string, writtenHere: boolean): HTMLElement {
  const word = document.createElement('del');
  word.className = writtenHere ? 'doc-block__removed doc-block__removed--own' : 'doc-block__removed';
  word.contentEditable = 'false';
  word.textContent = text;

  return word;
}

/**
 * what a block reads, and where each of its offsets sits in the document. A block made of
 * paragraphs breaks its text and spends a position on each one, so counting the characters alone
 * would both glue words together and drift.
 */
function readable(block: PMNode, blockPos: number): { positionAt: (offset: number) => number; text: string } {
  const runs: { from: number; length: number; start: number }[] = [];
  let text = '';

  block.descendants((node, pos) => {
    if (!node.isText) {
      if (text && !text.endsWith(' ')) {
        runs.push({ from: blockPos + 1 + pos, length: 1, start: text.length });
        text += ' ';
      }

      return true;
    }

    runs.push({ from: blockPos + 1 + pos, length: node.nodeSize, start: text.length });
    text += node.text ?? '';

    return false;
  });

  return {
    text,
    positionAt: (offset) => {
      const run = runs.findLast(({ start }) => start <= offset);
      if (!run) return blockPos + 1;

      return run.from + Math.min(offset - run.start, run.length);
    },
  };
}

/**
 * marks what an edited block no longer shares with the text the document proposes: the words the
 * agenda wrote on yellow, the ones written here on orange, the dropped ones struck through beside
 * them. The block holds both texts, so nothing is asked of the server.
 */
export function changedWordsOf(doc: PMNode, blocks: ReadonlySet<string>): Decoration[] {
  const decorations: Decoration[] = [];

  doc.descendants((node, pos) => {
    if (!blocks.has(node.type.name)) return true;

    const generatedHtml = node.attrs.generatedHtml as string | null;
    if (!generatedHtml) return false;

    const { positionAt, text } = readable(node, pos);
    const proposed = plainText(generatedHtml);
    const agendaHtml = node.attrs.agendaHtml as string | null;

    const changed = changedRanges(proposed, text);
    const removed = removedRuns(proposed, text);

    // the rule turns from the first keystroke, where the badge only speaks of what is saved
    if (changed.length > 0 || removed.length > 0) {
      decorations.push(
        Decoration.node(pos, pos + node.nodeSize, { class: 'doc-block--edited' }, { blockRule: true }),
      );
    }

    for (const range of changed) {
      decorations.push(
        Decoration.inline(positionAt(range.from), positionAt(range.to), {
          class: 'doc-block__changed',
        }),
      );
    }

    if (agendaHtml) {
      const carried = plainText(agendaHtml);

      for (const range of changedRanges(carried, text)) {
        decorations.push(
          Decoration.inline(
            positionAt(range.from),
            positionAt(range.to),
            { class: 'doc-block__changed doc-block__changed--own' },
            { writtenHere: true },
          ),
        );
      }
    }

    const droppedHere = new Set(
      agendaHtml ? removedRuns(plainText(agendaHtml), text).map(({ at, text: word }) => `${at}:${word}`) : [],
    );

    for (const run of removed) {
      const here = droppedHere.has(`${run.at}:${run.text}`);
      decorations.push(
        Decoration.widget(positionAt(run.at), () => removedWord(run.text, here), {
          ignoreSelection: true,
          side: -1,
        }),
      );
    }

    return false;
  });

  return decorations;
}

export function changedWords(options: { blocks: readonly string[]; name: string }): AnyExtension {
  const blocks = new Set(options.blocks);

  return Extension.create({
    name: options.name,

    addProseMirrorPlugins() {
      return [
        new Plugin({
          key: new PluginKey(options.name),
          props: {
            decorations: ({ doc }) => DecorationSet.create(doc, changedWordsOf(doc, blocks)),
          },
        }),
      ];
    },
  });
}
