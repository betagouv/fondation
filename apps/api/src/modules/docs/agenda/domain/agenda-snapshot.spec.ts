import * as assert from 'node:assert';

import { DateOnly } from 'src/utils/date-only';
import { makeId } from 'src/utils/id';

import { AgendaSnapshot } from './agenda-snapshot';

describe('AgendaSnapshot', () => {
  it('should detect a change in reporters', () => {
    const snapshot = AgendaSnapshot.from({
      agendaId: makeId('AgendaId'),
      chairmanId: null,
      date: DateOnly.fromJson({ year: 2026, month: 8, day: 1 }),
      sessionMeetingDate: DateOnly.fromJson({ year: 2026, month: 8, day: 1 }),
      nominationFiles: [
        {
          id: 1n,
          nominationFileId: `nf-1`,
          reporters: ['MME Jeanne MAS', 'M. Jean-Michel JARRE'],
          isManuallyEdited: false,
        },
        { id: 2n, nominationFileId: `nf-2`, reporters: ['M. Jean-Michel JARRE'], isManuallyEdited: false },
      ],
    });

    const diff = snapshot.diffReporters({
      nominationFiles: [{ id: `nf-1`, reporters: ['M. Jean-Michel JARRE'] }],
    });

    expect(diff.hasAny).toBe(true);
    assert.ok(diff.hasAny);

    expect(diff.updated).toEqual([{ id: 1n, reporters: ['M. Jean-Michel JARRE'], isOutdated: false }]);
  });

  it('should not report any change, when none is made', () => {
    const snapshot = AgendaSnapshot.from({
      agendaId: makeId('AgendaId'),
      chairmanId: null,
      date: DateOnly.fromJson({ year: 2026, month: 8, day: 1 }),
      sessionMeetingDate: DateOnly.fromJson({ year: 2026, month: 8, day: 1 }),
      nominationFiles: [
        {
          id: 1n,
          nominationFileId: `nf-1`,
          reporters: ['MME Jeanne MAS', 'M. Jean-Michel JARRE'],
          isManuallyEdited: false,
        },
        { id: 2n, nominationFileId: `nf-2`, reporters: ['M. Jean-Michel JARRE'], isManuallyEdited: false },
      ],
    });

    const diff = snapshot.diffReporters({
      nominationFiles: [{ id: `nf-1`, reporters: ['MME Jeanne MAS', 'M. Jean-Michel JARRE'] }],
    });

    expect(diff.hasAny).toBe(false);
  });

  it('should declare outdated files', () => {
    const snapshot = AgendaSnapshot.from({
      agendaId: makeId('AgendaId'),
      chairmanId: null,
      date: DateOnly.fromJson({ year: 2026, month: 8, day: 1 }),
      sessionMeetingDate: DateOnly.fromJson({ year: 2026, month: 8, day: 1 }),
      nominationFiles: [
        {
          id: 1n,
          nominationFileId: `nf-1`,
          reporters: ['MME Jeanne MAS', 'M. Jean-Michel JARRE'],
          isManuallyEdited: false,
        },
        { id: 2n, nominationFileId: `nf-2`, reporters: ['M. Jean-Michel JARRE'], isManuallyEdited: true },
      ],
    });

    const diff = snapshot.diffReporters({
      nominationFiles: [{ id: `nf-2`, reporters: ['MME Jeanne MAS'] }],
    });

    expect(diff.hasAny).toBe(true);
    assert.ok(diff.hasAny);

    expect(diff.updated).toEqual([{ id: 2n, reporters: ['MME Jeanne MAS'], isOutdated: true }]);
  });
});
