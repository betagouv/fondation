/** a paragraph, a list or a break separates words: without it, the two it sits between run into one */
const BLOCK_TAGS = /<\/?(p|div|li|ul|ol|h[1-6]|br)\s*\/?>/gi;

export function plainText(html: string): string {
  const broken = html.replace(BLOCK_TAGS, ' ');

  return new DOMParser().parseFromString(broken, 'text/html').body.textContent ?? '';
}

/**
 * the template and the editor write the same sentence differently, so the editor's own paragraph
 * wrappers and its spacing are set aside. The emphasis is not: putting a name in bold is an
 * edition of its own.
 * @warning the server decides the very same way whether a block was ever edited: the two rules
 * have to read alike, or a block would be credited on one side and not on the other.
 */
export function readsTheSame(left: string, right: string): boolean {
  const reading = (html: string) =>
    html
      .replace(BLOCK_TAGS, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  return reading(left) === reading(right);
}

export type TextRange = { from: number; to: number };

/** words the edited text no longer carries, and the offset where they used to be read */
export type RemovedRun = { at: number; text: string };

type Word = TextRange & { text: string };

function words(text: string): Word[] {
  return Array.from(text.matchAll(/\S+/g), (match) => ({
    from: match.index,
    text: match[0],
    to: match.index + match[0].length,
  }));
}

/** how many words the two sides still share, read from each pair of positions onwards */
function commonLengths(left: readonly Word[], right: readonly Word[]): number[][] {
  const lengths: number[][] = Array.from({ length: left.length + 1 }, () =>
    new Array<number>(right.length + 1).fill(0),
  );

  for (let l = left.length - 1; l >= 0; l--) {
    for (let r = right.length - 1; r >= 0; r--) {
      lengths[l]![r] =
        left[l]!.text === right[r]!.text
          ? lengths[l + 1]![r + 1]! + 1
          : Math.max(lengths[l + 1]![r]!, lengths[l]![r + 1]!);
    }
  }

  return lengths;
}

/** longest common subsequence, as the indexes of the right words that also appear on the left */
function commonWords(left: readonly Word[], right: readonly Word[]): Set<number> {
  const lengths = commonLengths(left, right);

  const common = new Set<number>();
  let l = 0;
  let r = 0;

  while (l < left.length && r < right.length) {
    if (left[l]!.text === right[r]!.text) {
      common.add(r);
      l++;
      r++;
    } else if (lengths[l + 1]![r]! >= lengths[l]![r + 1]!) {
      l++;
    } else {
      r++;
    }
  }

  return common;
}

/**
 * the words of `edited` that the `original` does not carry, as ranges of `edited`.
 * Neighbouring words are merged so a rewritten passage reads as one span rather than a stutter.
 */
export function changedRanges(original: string, edited: string): TextRange[] {
  const right = words(edited);
  const common = commonWords(words(original), right);

  const ranges: TextRange[] = [];
  for (const [index, word] of right.entries()) {
    if (common.has(index)) continue;

    const previous = ranges.at(-1);
    const follows = previous && right[index - 1] && !common.has(index - 1);

    if (follows && previous) {
      previous.to = word.to;
    } else {
      ranges.push({ from: word.from, to: word.to });
    }
  }

  return ranges;
}

/**
 * the words of `original` that the `edited` text dropped, each anchored to the offset of `edited`
 * where it used to be read. Neighbouring words are merged into one run.
 */
export function removedRuns(original: string, edited: string): RemovedRun[] {
  const left = words(original);
  const right = words(edited);
  const lengths = commonLengths(left, right);

  const runs: RemovedRun[] = [];
  let l = 0;
  let r = 0;

  while (l < left.length) {
    const kept = r < right.length && left[l]!.text === right[r]!.text;
    if (kept) {
      l++;
      r++;
      continue;
    }

    // past the end of the edited text, the dropped words belong to its tail
    const dropped = r >= right.length || lengths[l + 1]![r]! >= lengths[l]![r + 1]!;
    if (!dropped) {
      r++;
      continue;
    }

    const at = r < right.length ? right[r]!.from : edited.length;
    const previous = runs.at(-1);

    if (previous?.at === at) {
      previous.text = `${previous.text} ${left[l]!.text}`;
    } else {
      runs.push({ at, text: left[l]!.text });
    }

    l++;
  }

  return runs;
}
