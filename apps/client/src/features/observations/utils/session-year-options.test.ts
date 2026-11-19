import { describe, expect, it } from 'vitest';

import { toSessionYearOptions } from './session-year-options';

describe('toSessionYearOptions', () => {
  it('should offer the years with a suite, most recent first', () => {
    expect(toSessionYearOptions({ items: [{ year: 2025 }, { year: 2026 }] }, [])).toEqual([
      { id: '2026', label: '2026' },
      { id: '2025', label: '2025' },
    ]);
  });

  it('should keep offering a checked year that lost its last suite, once', () => {
    expect(toSessionYearOptions({ items: [{ year: 2026 }] }, ['2024', '2026'])).toEqual([
      { id: '2026', label: '2026' },
      { id: '2024', label: '2024' },
    ]);
  });

  it('should offer a value edited by hand in the link, so that it can be unchecked', () => {
    expect(toSessionYearOptions({ items: [{ year: 2026 }] }, ['abc'])).toEqual([
      { id: 'abc', label: 'abc' },
      { id: '2026', label: '2026' },
    ]);
  });
});
