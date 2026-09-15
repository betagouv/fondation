import { describe, expect, it } from 'vitest';

import { requiresJurisdictionSheet } from './jurisdiction-sheet-rule';

describe('requiresJurisdictionSheet', () => {
  it('asks for a sheet on the head of the parquet', () => {
    expect(requiresJurisdictionSheet("Procureur Général près la cour d'appel de Douai")).toBe(true);
    expect(requiresJurisdictionSheet('Procureur de la République TJ GRASSE')).toBe(true);
  });

  it('spares their deputies', () => {
    expect(requiresJurisdictionSheet("Procureur Général adjoint près la cour d'appel de Douai")).toBe(false);
    expect(requiresJurisdictionSheet('Procureur de la République adjoint TJ GRASSE')).toBe(false);
  });

  it('reads the position whatever its case and accents', () => {
    expect(requiresJurisdictionSheet("PROCUREUR GENERAL PRES LA COUR D'APPEL DE DOUAI")).toBe(true);
    expect(requiresJurisdictionSheet('procureur de la republique tj grasse')).toBe(true);
  });

  it('leaves the other positions alone', () => {
    expect(requiresJurisdictionSheet('Premier vice-procureur TJ LYON')).toBe(false);
    expect(requiresJurisdictionSheet('Substitut général près la cour de cassation')).toBe(false);
  });

  it('asks for nothing when the position is missing', () => {
    expect(requiresJurisdictionSheet('   ')).toBe(false);
    expect(requiresJurisdictionSheet(null)).toBe(false);
    expect(requiresJurisdictionSheet(undefined)).toBe(false);
  });
});
