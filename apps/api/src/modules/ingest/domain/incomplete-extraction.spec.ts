import { describe, expect, it } from 'vitest';

import { isIncompleteExtraction } from './incomplete-extraction';

describe('isIncompleteExtraction', () => {
  const MAX_DEACTIVATION_RATIO = 0.02;

  it('accepts deactivations under the threshold', () => {
    expect(isIncompleteExtraction({ active: 9_000, deactivations: 179 }, MAX_DEACTIVATION_RATIO)).toBe(false);
  });

  it('accepts deactivations at the threshold, only exceeding it blocks', () => {
    expect(isIncompleteExtraction({ active: 9_000, deactivations: 180 }, MAX_DEACTIVATION_RATIO)).toBe(false);
  });

  it('reports deactivations above the threshold', () => {
    expect(isIncompleteExtraction({ active: 9_000, deactivations: 181 }, MAX_DEACTIVATION_RATIO)).toBe(true);
  });

  it('accepts an import without any deactivation', () => {
    expect(isIncompleteExtraction({ active: 9_000, deactivations: 0 }, MAX_DEACTIVATION_RATIO)).toBe(false);
  });

  it('accepts the first import, no magistrat being active yet', () => {
    expect(isIncompleteExtraction({ active: 0, deactivations: 0 }, MAX_DEACTIVATION_RATIO)).toBe(false);
  });

  it('reports a single deactivation when the threshold is zero', () => {
    expect(isIncompleteExtraction({ active: 9_000, deactivations: 1 }, 0)).toBe(true);
  });

  it('never reports when the threshold covers every active magistrat', () => {
    expect(isIncompleteExtraction({ active: 2, deactivations: 2 }, 1)).toBe(false);
  });
});
