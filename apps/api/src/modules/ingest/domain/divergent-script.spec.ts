import { describe, expect, it } from 'vitest';

import { isScriptDivergent } from './divergent-script';

describe('isScriptDivergent', () => {
  const expected = '1b505a8caa08';

  it('reports a relay announcing another digest', () => {
    expect(isScriptDivergent({ fromRelay: true, announced: 'deadbeef1234', expected })).toBe(true);
  });

  it('reports a relay announcing nothing, which is an older copy', () => {
    expect(isScriptDivergent({ fromRelay: true, announced: undefined, expected })).toBe(true);
  });

  it('accepts a relay announcing the expected digest', () => {
    expect(isScriptDivergent({ fromRelay: true, announced: expected, expected })).toBe(false);
  });

  it('never blames the relay for a manual upload, which carries no digest', () => {
    expect(isScriptDivergent({ fromRelay: false, announced: undefined, expected })).toBe(false);
  });

  it('stays quiet while no digest is expected, before the first deployment', () => {
    expect(isScriptDivergent({ fromRelay: true, announced: undefined, expected: null })).toBe(false);
  });
});
