import { describe, expect, it } from 'vitest';

import { whoWrote } from './user.utils';

describe('whoWrote', () => {
  it.each([
    [null, 'nobody'],
    [{ id: 'me' }, 'self'],
    [{ id: 'someone-else' }, 'someone'],
  ] as const)('signs a change written by %j as %s', (writer, who) => {
    expect(whoWrote({ currentUserId: 'me', writer })).toBe(who);
  });
});
