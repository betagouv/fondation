import { formatPhoneNumber } from './string.utils';

describe('formatPhoneNumber', () => {
  it.each([
    ['0663081211', '06 63 08 12 11'],
    ['06620037 17', '06 62 00 37 17'],
    ['+33 6 63 08 12 11', '+33 6 63 08 12 11'],
  ])('formats %s as %s', (input, expected) => {
    expect(formatPhoneNumber(input)).toBe(expected);
  });
});
