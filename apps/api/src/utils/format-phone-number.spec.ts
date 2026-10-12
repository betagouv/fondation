import { formatPhoneNumber } from './format-phone-number';

describe('formatPhoneNumber', () => {
  it.each([
    ['0700000000', '07 00 00 00 00'],
    ['06.12.34.56.78', '06 12 34 56 78'],
    ['06620037 17', '06 62 00 37 17'],
    ['+262262123456', '+262262123456'],
  ])('formats %s as %s', (input, expected) => {
    expect(formatPhoneNumber(input)).toBe(expected);
  });
});
