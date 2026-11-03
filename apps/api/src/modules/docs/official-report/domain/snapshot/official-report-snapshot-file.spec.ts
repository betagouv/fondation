import {
  OfficialReportSnapshotFile,
  type PlainOfficialReportSnapshotFile,
} from './official-report-snapshot-file';

const NOMINATION_FILE_ID = 'nomination-file-id';

function makeFile(overrides: Partial<PlainOfficialReportSnapshotFile> = {}): OfficialReportSnapshotFile {
  return OfficialReportSnapshotFile.from({
    hasManuallyEditedHtml: false,
    nominationFileId: NOMINATION_FILE_ID,
    note: { html: null, outdated: false, status: 'GENERATED' },
    outcome: { comment: null, value: 'SUSPENDED' },
    recusedMembers: [],
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

    expect(diff).toEqual([]);
  });

  it('still follows a suspended file that stays suspended', () => {
    const file = makeFile({ outcome: { comment: null, value: 'SUSPENDED' } });

    const diff = file.diff({
      nominationFileId: NOMINATION_FILE_ID,
      outcome: { comment: 'en attente du complément', value: 'SUSPENDED' },
    });

    expect(diff.map(({ action }) => action)).toEqual(['update']);
  });

  it('follows a file whose final outcome changed', () => {
    const file = makeFile({ outcome: { comment: null, value: 'VALIDATED' } });

    const diff = file.diff({
      nominationFileId: NOMINATION_FILE_ID,
      outcome: { comment: 'motivation', value: 'NON_VALIDATED' },
    });

    expect(diff.map(({ action }) => action)).toEqual(['update']);
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

    expect(diff.map(({ action }) => action)).toEqual(['outdate']);
  });

  it('ignores an unchanged file', () => {
    const file = makeFile({
      outcome: { comment: null, value: 'VALIDATED' },
      recusedMembers: ['M. Paul FORGET'],
    });

    const diff = file.diff({
      nominationFileId: NOMINATION_FILE_ID,
      outcome: { comment: null, value: 'VALIDATED' },
      recusedMembers: ['M. Paul FORGET'],
      reporters: ['Madame Camille DURAND'],
    });

    expect(diff).toEqual([]);
  });

  describe('recusal', () => {
    it('lets the generated sentence follow the recusal', () => {
      const file = makeFile();

      const diff = file.diff({ nominationFileId: NOMINATION_FILE_ID, recusedMembers: ['M. Paul FORGET'] });

      expect(diff).toEqual([
        {
          action: 'recuse',
          nominationFileId: NOMINATION_FILE_ID,
          note: 'follow',
          recusedMembers: ['M. Paul FORGET'],
        },
      ]);
    });

    it('flags a text written in the report rather than overwriting it', () => {
      const file = makeFile({ note: { html: '<p>Texte</p>', outdated: false, status: 'EDITED' } });

      const diff = file.diff({ nominationFileId: NOMINATION_FILE_ID, recusedMembers: ['M. Paul FORGET'] });

      expect(diff).toMatchObject([{ action: 'recuse', note: 'outdate' }]);
    });

    it('flags a removed mention while members remain recused', () => {
      const file = makeFile({
        note: { html: null, outdated: false, status: 'REMOVED' },
        recusedMembers: ['M. Paul FORGET'],
      });

      const diff = file.diff({
        nominationFileId: NOMINATION_FILE_ID,
        recusedMembers: ['M. Paul FORGET', 'Mme Anne DUPONT'],
      });

      expect(diff).toMatchObject([{ action: 'recuse', note: 'outdate' }]);
    });

    it('gives a removed mention back to the sentence once nobody is recused', () => {
      const file = makeFile({
        note: { html: null, outdated: false, status: 'REMOVED' },
        recusedMembers: ['M. Paul FORGET'],
      });

      const diff = file.diff({ nominationFileId: NOMINATION_FILE_ID, recusedMembers: [] });

      expect(diff).toMatchObject([{ action: 'recuse', note: 'generate', recusedMembers: [] }]);
    });

    it('reports the block and the mention apart when both change', () => {
      const file = makeFile({ outcome: { comment: null, value: 'VALIDATED' } });

      const diff = file.diff({
        nominationFileId: NOMINATION_FILE_ID,
        outcome: { comment: null, value: 'WITHDRAWN' },
        recusedMembers: ['M. Paul FORGET'],
      });

      expect(diff.map(({ action }) => action)).toEqual(['update', 'recuse']);
    });
  });

  describe('note', () => {
    it('reads the text it was given', () => {
      const file = makeFile({ note: { html: '<p>Texte</p>', outdated: false, status: 'EDITED' } });

      expect(file.readsNote('<p>Texte</p>')).toBe(true);
    });

    it('takes the same text again to settle a recusal changed since', () => {
      const file = makeFile({ note: { html: '<p>Texte</p>', outdated: true, status: 'EDITED' } });

      expect(file.readsNote('<p>Texte</p>')).toBe(false);
    });

    it('remembers a removal while a recusal would print its sentence', () => {
      const file = makeFile({ recusedMembers: ['M. Paul FORGET'] });

      expect(file.noteStatusOnRemoval()).toBe('REMOVED');
    });

    it('goes back to the sentence when a text is removed from a file without recusal', () => {
      const file = makeFile({ note: { html: '<p>Texte</p>', outdated: false, status: 'EDITED' } });

      expect(file.noteStatusOnRemoval()).toBe('GENERATED');
    });

    it('has nothing to remove from an empty slot', () => {
      expect(makeFile().noteStatusOnRemoval()).toBeNull();
      expect(
        makeFile({
          note: { html: null, outdated: false, status: 'REMOVED' },
          recusedMembers: ['M. Paul FORGET'],
        }).noteStatusOnRemoval(),
      ).toBeNull();
    });

    it('removes again a removed mention to settle a recusal changed since', () => {
      const file = makeFile({
        note: { html: null, outdated: true, status: 'REMOVED' },
        recusedMembers: ['M. Paul FORGET'],
      });

      expect(file.noteStatusOnRemoval()).toBe('REMOVED');
    });
  });
});
