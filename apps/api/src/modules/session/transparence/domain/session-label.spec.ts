import { DateOnly } from 'src/utils/date-only';

import { sessionLabel } from './session-label';

describe('sessionLabel', () => {
  it('designates a session by its date and its name', () => {
    expect(sessionLabel({ date: new DateOnly(2026, 3, 2), name: 'Transparence du 2 mars 2026' })).toBe(
      'T 02/03/2026 (Transparence du 2 mars 2026)',
    );
  });
});
