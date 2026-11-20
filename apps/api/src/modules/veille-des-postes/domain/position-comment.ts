/** six lines of a tooltip at most: the side panel gives the whole comment */
const PREVIEW_LENGTH = 300;

export function showsCommentIcon(comment: string | null): boolean {
  return comment !== null && /[\p{L}\p{N}]/u.test(comment);
}

/** the comment the icon of the tables shows on hover: null when it shows no icon */
export function commentPreviewOf(comment: string | null): string | null {
  if (comment === null || !showsCommentIcon(comment)) return null;

  // a comment never holds more characters than code units: a short one needs no segmenting
  if (comment.length <= PREVIEW_LENGTH) return comment;

  // cut by what reads as one character: a slice could split an emoji in two. Read up to the first one left out
  let preview = '';
  let count = 0;
  for (const { segment } of new Intl.Segmenter('fr', { granularity: 'grapheme' }).segment(comment)) {
    if (count === PREVIEW_LENGTH) return `${preview.trimEnd()}…`;

    preview += segment;
    count += 1;
  }

  return comment;
}

/**
 * the head of a court is commented on its court, which keeps the comment from one holder to the next and while
 * vacant. The holders of the Cour de cassation share their positions: each one is commented on their own
 */
export type CommentedPosition = { courtId: string } | { magistratId: string; positionId: number };

export class PositionCommentErased {
  constructor(readonly position: CommentedPosition) {}
}

export class PositionCommentWritten {
  constructor(
    readonly authorId: string,
    readonly comment: string,
    readonly position: CommentedPosition,
  ) {}
}

export type PositionCommentEvent = PositionCommentErased | PositionCommentWritten;

export class PositionComment {
  readonly #messages: PositionCommentEvent[] = [];

  private constructor(readonly position: CommentedPosition) {}

  get messages(): readonly PositionCommentEvent[] {
    return this.#messages;
  }

  static of(position: CommentedPosition): PositionComment {
    return new PositionComment(position);
  }

  write(command: { authorId: string; comment: string }): void {
    const comment = command.comment.trim();

    this.#messages.push(
      comment
        ? new PositionCommentWritten(command.authorId, comment, this.position)
        : new PositionCommentErased(this.position),
    );
  }
}
