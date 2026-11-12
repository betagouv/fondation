import {
  OfficialReportSnapshotFile,
  type PlainOfficialReportSnapshotFile,
} from './official-report-snapshot-file';

const NOMINATION_FILE_ID = 'nomination-file-id';
const FORGET = { id: 'member-forget', name: 'M. Paul FORGET' };
const DUPONT = { id: 'member-dupont', name: 'Mme Anne DUPONT' };
const DURAND = { id: 'member-durand', name: 'Madame Camille DURAND' };
const DURAND_RENAMED = { ...DURAND, name: 'Madame Camille DURAND-MARTIN' };

function makeFile(overrides: Partial<PlainOfficialReportSnapshotFile> = {}): OfficialReportSnapshotFile {
  return OfficialReportSnapshotFile.from({
    hasManuallyEditedHtml: false,
    nominationFileId: NOMINATION_FILE_ID,
    note: { html: null, outdatedBy: null, status: 'GENERATED' },
    outcome: { comment: null, value: 'SUSPENDED' },
    recusedMembers: [],
    reporters: [DURAND],
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
      recusedMembers: [FORGET],
    });

    const diff = file.diff({
      nominationFileId: NOMINATION_FILE_ID,
      outcome: { comment: null, value: 'VALIDATED' },
      recusedMembers: [FORGET],
      reporters: [DURAND],
    });

    expect(diff).toEqual([]);
  });

  describe('reporters', () => {
    it('lets a generated block follow a renamed reporter', () => {
      const file = makeFile();

      const diff = file.diff({ nominationFileId: NOMINATION_FILE_ID, reporters: [DURAND_RENAMED] });

      expect(diff).toMatchObject([{ action: 'update', reporters: [DURAND_RENAMED] }]);
    });

    it('keeps the name a block written by hand gives without flagging it', () => {
      const file = makeFile({ hasManuallyEditedHtml: true });

      const diff = file.diff({ nominationFileId: NOMINATION_FILE_ID, reporters: [DURAND_RENAMED] });

      // the stored name still follows, for the block to print it once given back to the template
      expect(diff).toMatchObject([{ action: 'rename', reporters: [DURAND_RENAMED] }]);
    });

    it('flags a block written by hand once another member reports', () => {
      const file = makeFile({ hasManuallyEditedHtml: true });

      const diff = file.diff({ nominationFileId: NOMINATION_FILE_ID, reporters: [DUPONT] });

      expect(diff).toMatchObject([{ action: 'outdate', reporters: [DUPONT] }]);
    });

    it('knows a reporter stored before the ids were kept by name only', () => {
      const file = makeFile({ hasManuallyEditedHtml: true, reporters: [{ id: null, name: DURAND.name }] });

      expect(file.diff({ nominationFileId: NOMINATION_FILE_ID, reporters: [DURAND] })).toEqual([]);
      expect(file.diff({ nominationFileId: NOMINATION_FILE_ID, reporters: [DURAND_RENAMED] })).toMatchObject([
        { action: 'outdate' },
      ]);
    });
  });

  describe('recusal', () => {
    it('lets the generated sentence follow the recusal', () => {
      const file = makeFile();

      const diff = file.diff({ nominationFileId: NOMINATION_FILE_ID, recusedMembers: [FORGET] });

      expect(diff).toEqual([
        {
          action: 'recuse',
          nominationFileId: NOMINATION_FILE_ID,
          note: 'follow',
          recusedMembers: [FORGET],
        },
      ]);
    });

    it('flags a text written in the report rather than overwriting it', () => {
      const file = makeFile({ note: { html: '<p>Texte</p>', outdatedBy: null, status: 'EDITED' } });

      const diff = file.diff({ nominationFileId: NOMINATION_FILE_ID, recusedMembers: [FORGET] });

      expect(diff).toMatchObject([{ action: 'recuse', note: 'outdate', outdatedBy: 'RECUSAL' }]);
    });

    it('flags a text written in the report with the designation when only a name changes', () => {
      const file = makeFile({
        note: { html: '<p>Texte</p>', outdatedBy: null, status: 'EDITED' },
        recusedMembers: [FORGET],
      });
      const renamed = { ...FORGET, name: 'M. le Bâtonnier FORGET' };

      const diff = file.diff({ nominationFileId: NOMINATION_FILE_ID, recusedMembers: [renamed] });

      expect(diff).toEqual([
        {
          action: 'recuse',
          nominationFileId: NOMINATION_FILE_ID,
          note: 'outdate',
          outdatedBy: 'DESIGNATION',
          recusedMembers: [renamed],
        },
      ]);
    });

    it('lets the generated sentence follow a renamed member without flagging it', () => {
      const file = makeFile({ recusedMembers: [FORGET] });
      const renamed = { ...FORGET, name: 'M. le Bâtonnier FORGET' };

      const diff = file.diff({ nominationFileId: NOMINATION_FILE_ID, recusedMembers: [renamed] });

      expect(diff).toMatchObject([{ action: 'recuse', note: 'follow', recusedMembers: [renamed] }]);
    });

    it('turns a flagged designation into a recusal change once a member is added', () => {
      const file = makeFile({
        note: { html: '<p>Texte</p>', outdatedBy: 'DESIGNATION', status: 'EDITED' },
        recusedMembers: [FORGET],
      });

      const diff = file.diff({ nominationFileId: NOMINATION_FILE_ID, recusedMembers: [FORGET, DUPONT] });

      expect(diff).toMatchObject([{ action: 'recuse', note: 'outdate', outdatedBy: 'RECUSAL' }]);
    });

    it('keeps a flagged recusal change when a member is then renamed', () => {
      const file = makeFile({
        note: { html: '<p>Texte</p>', outdatedBy: 'RECUSAL', status: 'EDITED' },
        recusedMembers: [FORGET],
      });

      const diff = file.diff({
        nominationFileId: NOMINATION_FILE_ID,
        recusedMembers: [{ ...FORGET, name: 'M. le Bâtonnier FORGET' }],
      });

      expect(diff).toMatchObject([{ action: 'recuse', note: 'outdate', outdatedBy: 'RECUSAL' }]);
    });

    it('knows a member stored before the ids were kept by name only', () => {
      const stored = { id: null, name: FORGET.name };
      const file = makeFile({
        note: { html: '<p>Texte</p>', outdatedBy: null, status: 'EDITED' },
        recusedMembers: [stored],
      });

      expect(file.diff({ nominationFileId: NOMINATION_FILE_ID, recusedMembers: [FORGET] })).toEqual([]);
      expect(
        file.diff({
          nominationFileId: NOMINATION_FILE_ID,
          recusedMembers: [{ ...FORGET, name: 'M. le Bâtonnier FORGET' }],
        }),
      ).toMatchObject([{ action: 'recuse', note: 'outdate', outdatedBy: 'RECUSAL' }]);
    });

    it('flags a removed mention while members remain recused', () => {
      const file = makeFile({
        note: { html: null, outdatedBy: null, status: 'REMOVED' },
        recusedMembers: [FORGET],
      });

      const diff = file.diff({
        nominationFileId: NOMINATION_FILE_ID,
        recusedMembers: [FORGET, DUPONT],
      });

      expect(diff).toMatchObject([{ action: 'recuse', note: 'outdate' }]);
    });

    it('keeps a removed mention without flagging it when a recused member is only renamed', () => {
      const file = makeFile({
        note: { html: null, outdatedBy: null, status: 'REMOVED' },
        recusedMembers: [FORGET],
      });
      const renamed = { ...FORGET, name: 'M. le Bâtonnier FORGET' };

      const diff = file.diff({ nominationFileId: NOMINATION_FILE_ID, recusedMembers: [renamed] });

      expect(diff).toEqual([
        { action: 'recuse', nominationFileId: NOMINATION_FILE_ID, note: 'keep', recusedMembers: [renamed] },
      ]);
    });

    it('gives a removed mention back to the sentence once nobody is recused', () => {
      const file = makeFile({
        note: { html: null, outdatedBy: null, status: 'REMOVED' },
        recusedMembers: [FORGET],
      });

      const diff = file.diff({ nominationFileId: NOMINATION_FILE_ID, recusedMembers: [] });

      expect(diff).toMatchObject([{ action: 'recuse', note: 'generate', recusedMembers: [] }]);
    });

    it('reports the block and the mention apart when both change', () => {
      const file = makeFile({ outcome: { comment: null, value: 'VALIDATED' } });

      const diff = file.diff({
        nominationFileId: NOMINATION_FILE_ID,
        outcome: { comment: null, value: 'WITHDRAWN' },
        recusedMembers: [FORGET],
      });

      expect(diff.map(({ action }) => action)).toEqual(['update', 'recuse']);
    });
  });

  describe('note', () => {
    it('reads the text it was given', () => {
      const file = makeFile({ note: { html: '<p>Texte</p>', outdatedBy: null, status: 'EDITED' } });

      expect(file.readsNote('<p>Texte</p>')).toBe(true);
    });

    it('takes the same text again to settle a recusal changed since', () => {
      const file = makeFile({ note: { html: '<p>Texte</p>', outdatedBy: 'RECUSAL', status: 'EDITED' } });

      expect(file.readsNote('<p>Texte</p>')).toBe(false);
    });

    it('remembers a removal while a recusal would print its sentence', () => {
      const file = makeFile({ recusedMembers: [FORGET] });

      expect(file.noteStatusOnRemoval()).toBe('REMOVED');
    });

    it('goes back to the sentence when a text is removed from a file without recusal', () => {
      const file = makeFile({ note: { html: '<p>Texte</p>', outdatedBy: null, status: 'EDITED' } });

      expect(file.noteStatusOnRemoval()).toBe('GENERATED');
    });

    it('has nothing to remove from an empty slot', () => {
      expect(makeFile().noteStatusOnRemoval()).toBeNull();
      expect(
        makeFile({
          note: { html: null, outdatedBy: null, status: 'REMOVED' },
          recusedMembers: [FORGET],
        }).noteStatusOnRemoval(),
      ).toBeNull();
    });

    it('removes again a removed mention to settle a recusal changed since', () => {
      const file = makeFile({
        note: { html: null, outdatedBy: 'RECUSAL', status: 'REMOVED' },
        recusedMembers: [FORGET],
      });

      expect(file.noteStatusOnRemoval()).toBe('REMOVED');
    });
  });
});
