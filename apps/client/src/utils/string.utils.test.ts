import { formatPhoneNumber, requiresElision } from './string.utils';

describe('requiresElision', () => {
  it.each([
    ['AUBRY Gaspard', true],
    ['ÉLIE Marc', true],
    ['HUGO Anne', true],
    ['KOFFI Aminata', false],
    ['', false],
  ])('returns %s for "%s"', (word, expected) => {
    expect(requiresElision(word)).toBe(expected);
  });
});

describe('formatPhoneNumber', () => {
  it.each([
    ['0663081211', '06 63 08 12 11'],
    ['06620037 17', '06 62 00 37 17'],
    ['06.12.34.56.78', '06 12 34 56 78'],
    ['06-12-34-56-78', '06 12 34 56 78'],
    ['+33 6 63 08 12 11', '+33 6 63 08 12 11'],
  ])('formats %s as %s', (input, expected) => {
    expect(formatPhoneNumber(input)).toBe(expected);
  });
});
