import {
  civilityOf,
  courtOfAppealFirstPresidentTitle,
  courtOfCassationHolderTitle,
  judicialCourtPresidentTitle,
} from './holder-title';

describe('civilityOf', () => {
  it.each([
    ['MME', 'MME'],
    ['M.', 'M.'],
    ['Mme', null],
    [null, null],
  ])('reads the LOLFI civility %s as %s', (lolfi, civility) => {
    expect(civilityOf(lolfi)).toBe(civility);
  });
});

describe('courtOfAppealFirstPresidentTitle', () => {
  it.each([
    ['M.', "Premier président de la cour d'appel d'Agen"],
    ['MME', "Première présidente de la cour d'appel d'Agen"],
  ] as const)('titles a holder %s', (civility, title) => {
    expect(courtOfAppealFirstPresidentTitle({ civility, courtLabel: "Cour d'appel d'Agen" })).toBe(title);
  });
});

describe('courtOfCassationHolderTitle', () => {
  it('titles a chamber president', () => {
    expect(
      courtOfCassationHolderTitle({ civility: 'M.', position: 'CHAMBER_PRESIDENT', service: 'ORDINARY' }),
    ).toBe('Président de chambre à la Cour de cassation');
  });

  it('titles a counsellor in extraordinary service', () => {
    expect(
      courtOfCassationHolderTitle({ civility: 'MME', position: 'COUNSELLOR', service: 'EXTRAORDINARY' }),
    ).toBe('Conseillère en service extraordinaire à la Cour de cassation');
  });

  it('titles the first president of the court, not in it', () => {
    expect(
      courtOfCassationHolderTitle({ civility: 'MME', position: 'FIRST_PRESIDENT', service: 'ORDINARY' }),
    ).toBe('Première présidente de la Cour de cassation');
  });
});

describe('judicialCourtPresidentTitle', () => {
  it('titles a president', () => {
    expect(
      judicialCourtPresidentTitle({ civility: 'MME', courtLabel: 'Tribunal judiciaire de Grasse' }),
    ).toBe('Présidente du tribunal judiciaire de Grasse');
  });
});
