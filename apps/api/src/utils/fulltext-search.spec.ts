import { toFullTextQuery, toMagistratFullTextQuery } from './fulltext-search';

describe('full text search', () => {
  describe('toFullTextQuery', () => {
    it('should convert a simple text query into a postgresql ts_query', () => {
      expect(toFullTextQuery(`Albert Eins`)).toBe(`albert & eins:*`);
    });

    it('should leave out the operators of a ts_query', () => {
      expect(toFullTextQuery(`d'Artagnan ! (Paul`)).toBe(`d & artagnan & paul:*`);
    });

    it('should give an empty query without any letter or digit', () => {
      expect(toFullTextQuery(` ! & `)).toBe(``);
    });
  });

  describe('toMagistratFullTextQuery', () => {
    it('should convert a simple text query into a postgresql ts_query adapted to the index in the magistrat table', () => {
      expect(toMagistratFullTextQuery(`Albert.Einstein@justice`)).toBe(`albert.einstein@justice:C*`);
    });

    it('should search every word of a name by its beginning', () => {
      expect(toMagistratFullTextQuery(`  Hélè   Dup `)).toBe(`hele:* & dup:*`);
    });

    it.each`
      input                  | expected
      ${`dupont !`}          | ${`dupont:*`}
      ${`d'Artagnan`}        | ${`d:* & artagnan:*`}
      ${`dupont: (paul | <`} | ${`dupont:* & paul:*`}
      ${`'`}                 | ${``}
      ${`a!b(@justice.fr`}   | ${`ab@justice.fr:C*`}
    `('should leave out the operators of a ts_query from $input', ({ input, expected }) => {
      expect(toMagistratFullTextQuery(input)).toBe(expected);
    });
  });
});
