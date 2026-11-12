import * as assert from 'node:assert';

import { DateOnly } from '../../../../utils/date-only';
import { makeId } from '../../../../utils/id';

import { AgendaSnapshot, type AgendaSnapshotFile } from './agenda-snapshot';

const MAS = { id: 'user-mas', name: 'Mme Jeanne MAS' };
const JARRE = { id: 'user-jarre', name: 'M. Jean-Michel JARRE' };

function makeSnapshot(nominationFiles: readonly AgendaSnapshotFile[]): AgendaSnapshot {
  return AgendaSnapshot.from({
    agendaId: makeId('AgendaId'),
    chairmanId: null,
    date: DateOnly.fromJson({ year: 2026, month: 8, day: 1 }),
    nominationFiles,
    sessionMeetingDate: DateOnly.fromJson({ year: 2026, month: 8, day: 1 }),
  });
}

describe('AgendaSnapshot', () => {
  it('should detect a change in reporters', () => {
    const snapshot = makeSnapshot([
      { id: 1n, isManuallyEdited: false, nominationFileId: 'nf-1', reporters: [MAS, JARRE] },
      { id: 2n, isManuallyEdited: false, nominationFileId: 'nf-2', reporters: [JARRE] },
    ]);

    const diff = snapshot.diffReporters({ nominationFiles: [{ id: 'nf-1', reporters: [JARRE] }] });

    assert.ok(diff.hasAny);
    expect(diff.updated).toEqual([
      { isManuallyEdited: false, nominationFileId: 'nf-1', reporters: [JARRE], whoChanged: true },
    ]);
  });

  it('should not report any change, when none is made', () => {
    const snapshot = makeSnapshot([
      { id: 1n, isManuallyEdited: false, nominationFileId: 'nf-1', reporters: [MAS, JARRE] },
    ]);

    const diff = snapshot.diffReporters({ nominationFiles: [{ id: 'nf-1', reporters: [MAS, JARRE] }] });

    expect(diff.hasAny).toBe(false);
  });

  it('should tell a block written by hand apart', () => {
    const snapshot = makeSnapshot([
      { id: 1n, isManuallyEdited: true, nominationFileId: 'nf-1', reporters: [JARRE] },
    ]);

    const diff = snapshot.diffReporters({ nominationFiles: [{ id: 'nf-1', reporters: [MAS] }] });

    assert.ok(diff.hasAny);
    expect(diff.updated).toEqual([
      { isManuallyEdited: true, nominationFileId: 'nf-1', reporters: [MAS], whoChanged: true },
    ]);
  });

  it('should tell a renamed reporter from a new one', () => {
    const snapshot = makeSnapshot([
      { id: 1n, isManuallyEdited: true, nominationFileId: 'nf-1', reporters: [MAS] },
    ]);
    const renamed = { ...MAS, name: 'Mme Jeanne MAS-DUPONT' };

    const diff = snapshot.diffReporters({ nominationFiles: [{ id: 'nf-1', reporters: [renamed] }] });

    assert.ok(diff.hasAny);
    expect(diff.updated).toEqual([
      { isManuallyEdited: true, nominationFileId: 'nf-1', reporters: [renamed], whoChanged: false },
    ]);
  });

  it('should know a reporter stored without id by name', () => {
    const snapshot = makeSnapshot([
      { id: 1n, isManuallyEdited: true, nominationFileId: 'nf-1', reporters: [{ id: null, name: MAS.name }] },
    ]);

    const sameName = snapshot.diffReporters({ nominationFiles: [{ id: 'nf-1', reporters: [MAS] }] });
    const otherName = snapshot.diffReporters({
      nominationFiles: [{ id: 'nf-1', reporters: [{ ...MAS, name: 'Mme Jeanne MAS-DUPONT' }] }],
    });

    expect(sameName.hasAny).toBe(false);
    assert.ok(otherName.hasAny);
    expect(otherName.updated[0]?.whoChanged).toBe(true);
  });
});
