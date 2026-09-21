import { describe, expect, it } from 'vitest';

import { changedRanges, plainText, readsTheSame, removedRuns } from './proposed-text';

const highlighted = (original: string, edited: string) =>
  changedRanges(original, edited).map(({ from, to }) => edited.slice(from, to));

describe('changedRanges', () => {
  it('should find nothing when the text has not moved', () => {
    expect(changedRanges('au poste de substitute', 'au poste de substitute')).toEqual([]);
  });

  it('should point at a replaced word', () => {
    expect(highlighted('au poste de substitute', 'au poste de procureure')).toEqual(['procureure']);
  });

  it('should point at an added word', () => {
    expect(highlighted('au poste de substitute', 'au poste de première substitute')).toEqual(['première']);
  });

  it('should point at nothing when words are only removed', () => {
    expect(highlighted('au poste de première substitute', 'au poste de substitute')).toEqual([]);
  });

  it('should gather neighbouring changes into a single span', () => {
    expect(highlighted('près le tribunal judiciaire de Valence', 'près la cour d’appel de Valence')).toEqual([
      'la cour d’appel',
    ]);
  });

  it('should hold several distant changes apart', () => {
    expect(
      highlighted('Mme GAMBIN Audrey au poste de substitute', 'Mme PERROT Audrey au poste de juge'),
    ).toEqual(['PERROT', 'juge']);
  });

  it('should tolerate the spacing of the two writers', () => {
    expect(changedRanges('au  poste\nde substitute', 'au poste de substitute')).toEqual([]);
  });
});

const removed = (original: string, edited: string) => removedRuns(original, edited).map(({ text }) => text);

describe('removedRuns', () => {
  it('should find nothing when the text has not moved', () => {
    expect(removedRuns('au poste de substitute', 'au poste de substitute')).toEqual([]);
  });

  it('should find nothing when a word is only added', () => {
    expect(removed('au poste de substitute', 'au poste de première substitute')).toEqual([]);
  });

  it('should name a dropped word', () => {
    expect(removed('au poste de première substitute', 'au poste de substitute')).toEqual(['première']);
  });

  it('should anchor the dropped word where it used to be read', () => {
    const edited = 'au poste de substitute';
    expect(removedRuns('au poste de première substitute', edited)).toEqual([
      { at: edited.indexOf('substitute'), text: 'première' },
    ]);
  });

  it('should gather neighbouring drops into a single run', () => {
    expect(removed('près la cour d’appel de Valence', 'près de Valence')).toEqual(['la cour d’appel']);
  });

  it('should hold several distant drops apart', () => {
    expect(removed('Mme GAMBIN Audrey au poste de substitute', 'Mme Audrey au poste de')).toEqual([
      'GAMBIN',
      'substitute',
    ]);
  });

  it('should anchor a drop at the very end to the end of the text', () => {
    const edited = 'au poste de';
    expect(removedRuns('au poste de substitute', edited)).toEqual([
      { at: edited.length, text: 'substitute' },
    ]);
  });

  it('should name the whole text when everything is dropped', () => {
    expect(removed('au poste de substitute', '')).toEqual(['au poste de substitute']);
  });

  it('should tolerate the spacing of the two writers', () => {
    expect(removedRuns('au  poste\nde substitute', 'au poste de substitute')).toEqual([]);
  });
});

const PROPOSED = `<strong>M.&nbsp;VIRBEL&nbsp;Eric</strong>, actuellement en détachement (G3).`;

describe('readsTheSame', () => {
  it('sets aside the paragraph the editor wraps the text in', () => {
    expect(readsTheSame(`<p>${PROPOSED}</p>`, PROPOSED)).toBe(true);
  });

  it('sets aside the spacing the two writers disagree on', () => {
    expect(
      readsTheSame(`<strong>M. VIRBEL  Eric</strong>,\n  actuellement en détachement (G3).`, PROPOSED),
    ).toBe(true);
  });

  it('holds a rewritten word as an edition', () => {
    expect(readsTheSame(`<p>${PROPOSED.replace('détachement', 'disponibilité')}</p>`, PROPOSED)).toBe(false);
  });

  it('holds a word put in bold as an edition of its own', () => {
    expect(
      readsTheSame(PROPOSED.replace('en détachement', '<strong>en détachement</strong>'), PROPOSED),
    ).toBe(false);
  });
});

describe('plainText', () => {
  it('keeps the last word of an item apart from the first of the next', () => {
    const words = plainText('<ul><li>Mme Camille COMMUN</li><li>M. Serge GÉNÉRAL</li></ul>').split(/\s+/);

    expect(words.filter(Boolean)).toEqual(['Mme', 'Camille', 'COMMUN', 'M.', 'Serge', 'GÉNÉRAL']);
  });
});
