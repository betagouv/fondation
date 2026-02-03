import { capitalize } from './capitalize';

describe('string utils', () => {
  describe('capitalize', () => {
    it.each`
      input              | expected
      ${'jean-baptiste'} | ${'Jean-Baptiste'}
      ${'jérémie'}       | ${'Jérémie'}
    `(`should convert "$input" into "$expected"`, ({ input, expected }) => {
      expect(capitalize(input)).toBe(expected);
    });
  });
});
