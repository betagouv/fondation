import { LolfiFunction, LolfiJurisdiction } from 'lolfi';

/**
 * @warning this is the test seed data, and should be preferred in tests.
 */

export const functions = {
  PR: {
    id: 'PR',
    label: 'Procureur de la République',
    labelOneMale: 'procureur de la République',
    labelOneFemale: 'procureure de la République',
    formation: 'PARQUET',
  },
  P: {
    id: 'P',
    label: 'Président',
    labelOneMale: 'président',
    labelOneFemale: 'présidente',
    addition: 'du {codejur}',
    formation: 'SIEGE',
  },
} as const satisfies Record<string, LolfiFunction>;

export const jurisdictions = {
  'CA  AIX EN PROVENCE': { id: 'CA  AIX EN PROVENCE', label: "Cour d'appel d'Aix en Provence" },
  'CA  LYON': { id: 'CA  LYON', label: "Cour d'appel de Lyon" },
  'CA  AMIENS': { id: 'CA  AMIENS', label: "Cour d'appel d'Amiens" },
  'CA  GRENOBLE': { id: 'CA  GRENOBLE', label: "Cour d'appel de Grenoble" },
  'CA  REIMS': { id: 'CA  GRENOBLE', label: "Cour d'appel de Reims" },
  'CA  MONTPELLIER': { id: 'CA  MONTPELLIER', label: "Cour d'appel de Montpellier" },
  'TJ   LYON': { id: 'TJ  LYON', label: 'Tribunal judiciaire de Lyon', ressort: 'CA  LYON' },
  'TJ  GRASSE': { id: 'TJ  GRASSE', label: 'Tribunal judiciaire de Grasse', ressort: 'CA  AIX EN PROVENCE' },
  'TPR  CANNES': {
    id: 'TPR  CANNES',
    label: 'Tribunal de proximité de Cannes',
    ressort: 'CA  AIX EN PROVENCE',
    arrondissement: 'TJ  GRASSE',
  },
  'TJ  TOULON': {
    id: 'TJ  TOULON',
    label: 'Tribunal judiciaire de Toulon',
    ressort: 'CA  AIX EN PROVENCE',
  },
  'TJ  NARBONNE': {
    id: 'TJ  NARBONNE',
    label: 'Tribunal judiciaire de Narbonne',
    ressort: 'CA  MONTPELLIER',
  },
  'TJ  BEZIERS': { id: 'TJ  BEZIERS', label: 'Tribunal judiciaire de Béziers', ressort: 'CA  MONTPELLIER' },
} as const satisfies Record<string, LolfiJurisdiction>;
