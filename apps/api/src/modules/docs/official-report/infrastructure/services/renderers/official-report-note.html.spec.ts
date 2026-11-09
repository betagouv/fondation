import { officialReportFileNote, recusalMention } from './official-report-note.html';

const STORED = {
  note: null,
  noteEditedAt: null,
  noteEditor: null,
  noteOutdatedBy: null,
  noteStatus: 'GENERATED',
  recusedMembers: [],
} as const;

function named(name: string) {
  return { id: null, name };
}

describe('recusalMention', () => {
  it('says nothing without recusal', () => {
    expect(recusalMention([])).toBeNull();
  });

  it('names a single recused member', () => {
    expect(recusalMention([named('M. Paul FORGET')])).toBe(
      "<p><em>Étant précisé que M. Paul FORGET n'a pas délibéré ni procédé aux actes préparatoires relatifs à cette proposition de nomination.</em></p>",
    );
  });

  it('links two members with "et" and agrees the verb', () => {
    expect(recusalMention([named('M. Paul FORGET'), named('Mme Anne DUPONT')])).toContain(
      "que M. Paul FORGET et Mme Anne DUPONT n'ont pas délibéré",
    );
  });

  it('separates the members with commas until the last one', () => {
    expect(
      recusalMention([named('M. Paul FORGET'), named('Mme Anne DUPONT'), named('M. Jean MARTIN')]),
    ).toContain("que M. Paul FORGET, Mme Anne DUPONT et M. Jean MARTIN n'ont pas délibéré");
  });

  it('reads a name written in HTML as text', () => {
    expect(recusalMention([named('<img src=x>')])).toContain('&lt;img src=x&gt;');
  });
});

describe('officialReportFileNote', () => {
  it('prints the recusal sentence while nobody wrote in the slot', () => {
    const note = officialReportFileNote({ ...STORED, recusedMembers: [named('M. Paul FORGET')] });

    expect(note.html).toBe(note.generatedHtml);
    expect(note.editedAt).toBeNull();
  });

  it('prints the text written in the report', () => {
    const note = officialReportFileNote({
      ...STORED,
      note: '<p>Texte</p>',
      noteEditedAt: new Date('2026-11-03T10:00:00.000Z'),
      noteEditor: { firstName: 'Simon', id: 'user-1', lastName: 'Secrétariat' },
      noteStatus: 'EDITED',
      recusedMembers: [named('M. Paul FORGET')],
    });

    expect(note).toMatchObject({
      editedAt: '2026-11-03T10:00:00.000Z',
      generatedHtml: expect.stringContaining('M. Paul FORGET'),
      html: '<p>Texte</p>',
    });
  });

  it('prints nothing once the mention is removed, and still offers it', () => {
    const note = officialReportFileNote({
      ...STORED,
      noteOutdatedBy: 'RECUSAL',
      noteStatus: 'REMOVED',
      recusedMembers: [named('M. Paul FORGET')],
    });

    expect(note).toMatchObject({ generatedHtml: expect.any(String), html: null, outdatedBy: 'RECUSAL' });
  });
});
