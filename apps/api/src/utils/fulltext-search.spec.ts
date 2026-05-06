import { toFullTextQuery, toMagistratFullTextQuery } from './fulltext-search';

describe('full text search', () => {
  describe('toFullTextQuery', () => {
    it('should convert a simple text query into a postgresql ts_query', () => {
      expect(toFullTextQuery(`Albert Eins`)).toBe(`albert & eins:*`);
    });

    it('should throw when an empty string is provided', () => {
      expect(() => toFullTextQuery(`   `)).toThrow();
    });
  });

  describe('toMagistratFullTextQuery', () => {
    it('should convert a simple text query into a postgresql ts_query adapted to the index in the magistrat table', () => {
      expect(toMagistratFullTextQuery(`Albert.Einstein@justice`)).toBe(`albert.einstein@justice:C*`);
    });
  });
});
