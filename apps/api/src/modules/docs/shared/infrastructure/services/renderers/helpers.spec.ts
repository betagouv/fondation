import { requiresElision } from './helpers';

describe('renderer helpers', () => {
  describe('requiresElision', () => {
    it.each`
      word            | expected
      ${'Procureur'}  | ${false}
      ${'Substitut'}  | ${false}
      ${'Avocat'}     | ${true}
      ${'Inspecteur'} | ${true}
      ${'Échevin'}    | ${true}
      ${'Huissier'}   | ${true}
      ${'  Avocat'}   | ${true}
      ${''}           | ${false}
    `(`returns $expected for "$word"`, ({ word, expected }) => {
      expect(requiresElision(word)).toBe(expected);
    });
  });
});
