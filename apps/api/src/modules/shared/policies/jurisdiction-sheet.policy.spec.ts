import { isJurisdictionSheetExpected } from './jurisdiction-sheet.policy';

describe('isJurisdictionSheetExpected', () => {
  it('asks for a sheet on the head of the parquet', () => {
    expect(isJurisdictionSheetExpected("Procureur Général près la cour d'appel de Douai")).toBe(true);
    expect(isJurisdictionSheetExpected('Procureur de la République TJ GRASSE')).toBe(true);
  });

  it('spares their deputies', () => {
    expect(isJurisdictionSheetExpected("Procureur Général adjoint près la cour d'appel de Douai")).toBe(
      false,
    );
    expect(isJurisdictionSheetExpected('Procureur de la République adjoint TJ GRASSE')).toBe(false);
  });

  it('reads the position whatever its case and accents', () => {
    expect(isJurisdictionSheetExpected("PROCUREUR GENERAL PRES LA COUR D'APPEL DE DOUAI")).toBe(true);
    expect(isJurisdictionSheetExpected('procureur de la republique tj grasse')).toBe(true);
  });

  it('leaves the other positions alone', () => {
    expect(isJurisdictionSheetExpected('Premier vice-procureur TJ LYON')).toBe(false);
    expect(isJurisdictionSheetExpected('Substitut général près la cour de cassation')).toBe(false);
  });

  it('asks for nothing when the position is missing', () => {
    expect(isJurisdictionSheetExpected('   ')).toBe(false);
    expect(isJurisdictionSheetExpected(null)).toBe(false);
  });
});
