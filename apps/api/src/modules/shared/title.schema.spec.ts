import { TitleSchema } from './title.schema';

describe('TitleSchema', () => {
  it.each([
    ['  le Bâtonnier  ', 'le Bâtonnier'],
    ['le\nBâtonnier', 'le Bâtonnier'],
    ['   ', null],
    [null, null],
  ])('records %j as %j', (title, recorded) => {
    expect(TitleSchema.parse(title)).toBe(recorded);
  });
});
