/** as much as the comments of the sessions and of the nomination files */
export const COMMENT_MAX_LENGTH = 50_000;

/** six lines of a tooltip at most: the side panel gives the whole comment */
const PREVIEW_LENGTH = 300;

export function showsCommentIcon(comment: string | null): boolean {
  return comment !== null && /[\p{L}\p{N}]/u.test(comment);
}

/** the comment the icon of the tables shows on hover, null when it shows no icon */
export function commentPreviewOf(comment: string | null): string | null {
  if (comment === null || !showsCommentIcon(comment)) return null;

  // a comment never holds more characters than code units: a short one needs no segmenting
  if (comment.length <= PREVIEW_LENGTH) return comment;

  // by what reads as one character, a slice could split an emoji in two. Read up to the first one left out
  let preview = '';
  let count = 0;
  for (const { segment } of new Intl.Segmenter('fr', { granularity: 'grapheme' }).segment(comment)) {
    if (count === PREVIEW_LENGTH) return `${preview.trimEnd()}…`;

    preview += segment;
    count += 1;
  }

  return comment;
}

export class PositionCommentErased {
  constructor(
    readonly magistratId: string,
    readonly positionId: number,
  ) {}
}

export class PositionCommentWritten {
  constructor(
    readonly authorId: string,
    readonly comment: string,
    readonly magistratId: string,
    readonly positionId: number,
  ) {}
}

export type PositionCommentEvent = PositionCommentErased | PositionCommentWritten;

export class PositionComment {
  readonly #messages: PositionCommentEvent[] = [];

  private constructor(
    readonly magistratId: string,
    readonly positionId: number,
  ) {}

  get messages(): readonly PositionCommentEvent[] {
    return this.#messages;
  }

  static of(props: { magistratId: string; positionId: number }): PositionComment {
    return new PositionComment(props.magistratId, props.positionId);
  }

  write(command: { authorId: string; comment: string }): void {
    const comment = command.comment.trim();

    this.#messages.push(
      comment
        ? new PositionCommentWritten(command.authorId, comment, this.magistratId, this.positionId)
        : new PositionCommentErased(this.magistratId, this.positionId),
    );
  }
}
