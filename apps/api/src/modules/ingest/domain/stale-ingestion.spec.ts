import { isStale } from './stale-ingestion';

describe('isStale', () => {
  const monday = new Date('2026-09-07T08:00:00Z');

  it('accepts an ingestion from the day before', () => {
    expect(isStale(new Date('2026-09-06T02:00:00Z'), monday)).toBe(false);
  });

  it('accepts a friday ingestion seen on monday, weekends having no deposit', () => {
    expect(isStale(new Date('2026-09-04T02:00:00Z'), monday)).toBe(false);
  });

  it('reports an ingestion older than four days', () => {
    expect(isStale(new Date('2026-09-03T02:00:00Z'), monday)).toBe(true);
  });

  it('reports a chain that never ingested anything', () => {
    expect(isStale(null, monday)).toBe(true);
  });
});
