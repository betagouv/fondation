import {
  OfficialReportSnapshotFile,
  type PlainOfficialReportSnapshotFile,
} from './official-report-snapshot-file';

const NOMINATION_FILE_ID = 'nomination-file-id';

function makeFile(overrides: Partial<PlainOfficialReportSnapshotFile> = {}): OfficialReportSnapshotFile {
  return OfficialReportSnapshotFile.from({
    id: 1n,
    nominationFileId: NOMINATION_FILE_ID,
    hasManuallyEditedHtml: false,
    reporters: ['Madame Camille DURAND'],
    outcome: { value: 'SUSPENDED', comment: null },
    ...overrides,
  });
}

describe('OfficialReportSnapshotFile', () => {
  it('keeps the suspension it reported when the file gets a final outcome', () => {
    const file = makeFile({ outcome: { value: 'SUSPENDED', comment: null } });

    const diff = file.diff({
      nominationFileId: NOMINATION_FILE_ID,
      outcome: { value: 'VALIDATED', comment: null },
    });

    expect(diff.action).toBe('noop');
  });

  it('still follows a suspended file that stays suspended', () => {
    const file = makeFile({ outcome: { value: 'SUSPENDED', comment: null } });

    const diff = file.diff({
      nominationFileId: NOMINATION_FILE_ID,
      outcome: { value: 'SUSPENDED', comment: 'en attente du complément' },
    });

    expect(diff.action).toBe('update');
  });

  it('follows a file whose final outcome changed', () => {
    const file = makeFile({ outcome: { value: 'VALIDATED', comment: null } });

    const diff = file.diff({
      nominationFileId: NOMINATION_FILE_ID,
      outcome: { value: 'NON_VALIDATED', comment: 'motivation' },
    });

    expect(diff.action).toBe('update');
  });

  it('outdates a manually edited block rather than overwriting it', () => {
    const file = makeFile({
      hasManuallyEditedHtml: true,
      outcome: { value: 'VALIDATED', comment: null },
    });

    const diff = file.diff({
      nominationFileId: NOMINATION_FILE_ID,
      outcome: { value: 'NON_VALIDATED', comment: 'motivation' },
    });

    expect(diff.action).toBe('outdate');
  });

  it('ignores an unchanged file', () => {
    const file = makeFile({ outcome: { value: 'VALIDATED', comment: null } });

    const diff = file.diff({
      nominationFileId: NOMINATION_FILE_ID,
      outcome: { value: 'VALIDATED', comment: null },
      reporters: ['Madame Camille DURAND'],
    });

    expect(diff.action).toBe('noop');
  });
});
