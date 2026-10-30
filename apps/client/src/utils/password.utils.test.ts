import { generatePassword, isStrongPassword } from './password.utils';

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

describe('generatePassword', () => {
  it('makes strong passwords, without characters mistaken for one another', () => {
    const passwords = Array.from({ length: 200 }, generatePassword);

    expect(passwords.every(isStrongPassword)).toBe(true);
    expect(passwords.join('')).not.toMatch(/[0O1lI]/);
    expect(new Set(passwords).size).toBe(passwords.length);
  });
});
