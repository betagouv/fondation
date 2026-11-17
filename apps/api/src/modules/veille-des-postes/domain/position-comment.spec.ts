import {
  commentPreviewOf,
  PositionComment,
  PositionCommentErased,
  PositionCommentWritten,
  showsCommentIcon,
} from './position-comment';

describe('commentPreviewOf', () => {
  it('cuts a long comment for the tooltip', () => {
    expect(commentPreviewOf('a'.repeat(400))).toBe(`${'a'.repeat(300)}…`);
  });

  it('cuts between two characters rather than inside an emoji', () => {
    expect(commentPreviewOf(`${'a'.repeat(299)}👩‍⚖️ fin`)).toBe(`${'a'.repeat(299)}👩‍⚖️…`);
  });

  it('keeps whole a comment of three hundred characters with an emoji longer than one code unit', () => {
    const comment = `${'a'.repeat(299)}👩‍⚖️`;

    expect(commentPreviewOf(comment)).toBe(comment);
  });

  it('leaves no preview without an icon to show it', () => {
    expect(commentPreviewOf('...')).toBeNull();
  });
});

describe('PositionComment', () => {
  it('erases a comment left with spaces only', () => {
    const comment = PositionComment.of({ magistratId: 'magistrat', positionId: 7 });

    comment.write({ authorId: 'author', comment: '   ' });

    expect(comment.messages).toEqual([new PositionCommentErased('magistrat', 7)]);
  });

  it('writes the comment without its surrounding spaces', () => {
    const comment = PositionComment.of({ magistratId: 'magistrat', positionId: 7 });

    comment.write({ authorId: 'author', comment: '  Souhaite partir en 2027 \n' });

    expect(comment.messages).toEqual([
      new PositionCommentWritten('author', 'Souhaite partir en 2027', 'magistrat', 7),
    ]);
  });
});

describe('showsCommentIcon', () => {
  it.each([
    ['À voir avec la CA', true],
    ['2027', true],
    ['...', false],
    ['', false],
    [null, false],
  ])('tells whether %j shows the comment icon: %s', (comment, shown) => {
    expect(showsCommentIcon(comment)).toBe(shown);
  });
});
