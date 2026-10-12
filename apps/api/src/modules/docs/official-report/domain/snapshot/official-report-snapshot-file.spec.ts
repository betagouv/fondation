import {
  OfficialReportSnapshotFile,
  type PlainOfficialReportSnapshotFile,
} from './official-report-snapshot-file';

const NOMINATION_FILE_ID = 'nomination-file-id';

function makeFile(overrides: Partial<PlainOfficialReportSnapshotFile> = {}): OfficialReportSnapshotFile {
  return OfficialReportSnapshotFile.from({
    hasManuallyEditedHtml: false,
    nominationFileId: NOMINATION_FILE_ID,
    outcome: { comment: null, value: 'SUSPENDED' },
    reporters: ['Madame Camille DURAND'],
    ...overrides,
  });
}

describe('OfficialReportSnapshotFile', () => {
  it('keeps the suspension it reported when the file gets a final outcome', () => {
    const file = makeFile({ outcome: { comment: null, value: 'SUSPENDED' } });

    const diff = file.diff({
      nominationFileId: NOMINATION_FILE_ID,
      outcome: { comment: null, value: 'VALIDATED' },
    });

    expect(diff.action).toBe('noop');
  });

  it('still follows a suspended file that stays suspended', () => {
    const file = makeFile({ outcome: { comment: null, value: 'SUSPENDED' } });

    const diff = file.diff({
      nominationFileId: NOMINATION_FILE_ID,
      outcome: { comment: 'en attente du complément', value: 'SUSPENDED' },
    });

    expect(diff.action).toBe('update');
  });

  it('follows a file whose final outcome changed', () => {
    const file = makeFile({ outcome: { comment: null, value: 'VALIDATED' } });

    const diff = file.diff({
      nominationFileId: NOMINATION_FILE_ID,
      outcome: { comment: 'motivation', value: 'NON_VALIDATED' },
    });

    expect(diff.action).toBe('update');
  });

  it('outdates a manually edited block rather than overwriting it', () => {
    const file = makeFile({
      hasManuallyEditedHtml: true,
      outcome: { comment: null, value: 'VALIDATED' },
    });

    const diff = file.diff({
      nominationFileId: NOMINATION_FILE_ID,
      outcome: { comment: 'motivation', value: 'NON_VALIDATED' },
    });

    expect(diff.action).toBe('outdate');
  });

  it('ignores an unchanged file', () => {
    const file = makeFile({ outcome: { comment: null, value: 'VALIDATED' } });

    const diff = file.diff({
      nominationFileId: NOMINATION_FILE_ID,
      outcome: { comment: null, value: 'VALIDATED' },
      reporters: ['Madame Camille DURAND'],
    });

    expect(diff.action).toBe('noop');
  });
});
