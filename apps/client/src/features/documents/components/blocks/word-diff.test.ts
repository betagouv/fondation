import { describe, expect, it } from 'vitest';

import { changedRanges, removedRuns } from './word-diff';

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
