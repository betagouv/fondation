import { isStrongPassword } from './password.utils';

describe('isStrongPassword', () => {
  it.each([
    ['Fondation-2026', true],
    ['  Fondation-2026  ', true],
    ['Fon-2026', false],
    ['fondation-2026', false],
    ['FONDATION-2026', false],
    ['Fondation-deux', false],
    ['Fondation2026', false],
    ['   Fon-2026   ', false],
  ])('tells %j is strong: %s', (password, expected) => {
    expect(isStrongPassword(password)).toBe(expected);
  });
});
