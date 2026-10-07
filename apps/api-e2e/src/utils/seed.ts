import { LolfiFunction, LolfiJurisdiction } from 'lolfi';

/**
 * @warning this is the test seed data, and should be preferred in tests.
 */

export const functions = {
  P: {
    addition: 'du {codejur}',
    formation: 'SIEGE',
    id: 'P',
    label: 'Président',
    labelOneFemale: 'présidente',
    labelOneMale: 'président',
  },
  PG: {
    formation: 'PARQUET',
    id: 'PG',
    label: 'Procureur Général',
    labelOneFemale: 'procureure générale',
    labelOneMale: 'procureur général',
  },
  PR: {
    formation: 'PARQUET',
    id: 'PR',
    label: 'Procureur de la République',
    labelOneFemale: 'procureure de la République',
    labelOneMale: 'procureur de la République',
  },
} as const satisfies Record<string, LolfiFunction>;

export const jurisdictions = {
  'CA  AIX EN PROVENCE': { id: 'CA  AIX EN PROVENCE', label: "Cour d'appel d'Aix en Provence" },
  'CA  AMIENS': { id: 'CA  AMIENS', label: "Cour d'appel d'Amiens" },
  'CA  GRENOBLE': { id: 'CA  GRENOBLE', label: "Cour d'appel de Grenoble" },
  'CA  LYON': { id: 'CA  LYON', label: "Cour d'appel de Lyon" },
  'CA  MONTPELLIER': { id: 'CA  MONTPELLIER', label: "Cour d'appel de Montpellier" },
  'CA  REIMS': { id: 'CA  REIMS', label: "Cour d'appel de Reims" },
  'TJ  BEZIERS': {
    id: 'TJ  BEZIERS',
    label: 'Tribunal judiciaire de Béziers',
    ressort: 'CA  MONTPELLIER',
  },
  'TJ  GRASSE': {
    id: 'TJ  GRASSE',
    label: 'Tribunal judiciaire de Grasse',
    ressort: 'CA  AIX EN PROVENCE',
  },
  'TJ  LYON': { id: 'TJ  LYON', label: 'Tribunal judiciaire de Lyon', ressort: 'CA  LYON' },
  'TJ  NARBONNE': {
    id: 'TJ  NARBONNE',
    label: 'Tribunal judiciaire de Narbonne',
    ressort: 'CA  MONTPELLIER',
  },
  'TJ  TOULON': {
    id: 'TJ  TOULON',
    label: 'Tribunal judiciaire de Toulon',
    ressort: 'CA  AIX EN PROVENCE',
  },
  'TPR CANNES': {
    arrondissement: 'TJ  GRASSE',
    id: 'TPR CANNES',
    label: 'Tribunal de proximité de Cannes',
    ressort: 'CA  AIX EN PROVENCE',
  },
} as const satisfies Record<string, LolfiJurisdiction>;
