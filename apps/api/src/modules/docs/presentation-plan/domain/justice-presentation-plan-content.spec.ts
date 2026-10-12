import {
  JusticePresentationPlanContent,
  JusticePresentationPlanFile,
} from './justice-presentation-plan-content';

describe('JusticePresentationPlanContent', () => {
  it('should read the same as itself', () => {
    const content = JusticePresentationPlanContent.from([
      aFile(),
      aFile({ nominationFileId: 'nf-2', number: 2 }),
    ]);

    expect(content.differsFrom(content)).toBe(false);
  });

  it('should ignore the order the propositions come in', () => {
    const second = aFile({ nominationFileId: 'nf-2', number: 2 });

    expect(
      JusticePresentationPlanContent.from([aFile(), second]).differsFrom(
        JusticePresentationPlanContent.from([second, aFile()]),
      ),
    ).toBe(false);
  });

  it('should differ when a proposition is added', () => {
    expect(
      JusticePresentationPlanContent.from([aFile()]).differsFrom(
        JusticePresentationPlanContent.from([aFile(), aFile({ nominationFileId: 'nf-2', number: 2 })]),
      ),
    ).toBe(true);
  });

  it('should differ when a proposition is removed', () => {
    expect(
      JusticePresentationPlanContent.from([
        aFile(),
        aFile({ nominationFileId: 'nf-2', number: 2 }),
      ]).differsFrom(JusticePresentationPlanContent.from([aFile()])),
    ).toBe(true);
  });

  it('should differ when a proposition is replaced by another', () => {
    expect(
      JusticePresentationPlanContent.from([aFile()]).differsFrom(
        JusticePresentationPlanContent.from([aFile({ nominationFileId: 'nf-2' })]),
      ),
    ).toBe(true);
  });

  it.each<[string, Partial<JusticePresentationPlanFile>]>([
    ['the magistrat name', { name: 'Jean-Michel JARRE' }],
    ['the rank the propositions are read in', { number: 12 }],
    ['the outcome', { outcome: 'NON_VALIDATED' }],
    ['the reason given for the outcome', { outcomeComment: `l'intéressée a renoncé` }],
    ['the targeted grade', { targetedGrade: 'I' }],
    ['the targeted position', { targetedPosition: `Premier président de la cour d'appel de Paris` }],
  ])('should differ when %s changes', (_, change) => {
    expect(
      JusticePresentationPlanContent.from([aFile()]).differsFrom(
        JusticePresentationPlanContent.from([aFile(change)]),
      ),
    ).toBe(true);
  });
});

function aFile(overrides: Partial<JusticePresentationPlanFile> = {}): JusticePresentationPlanFile {
  return {
    name: 'Jeanne MAS',
    nominationFileId: 'nf-1',
    number: 1,
    outcome: 'VALIDATED',
    outcomeComment: null,
    targetedGrade: 'HH',
    targetedPosition: 'Président du tribunal judiciaire de Marseille',
    ...overrides,
  };
}
