import { stripIndent } from 'common-tags';
import { Magistrat } from 'shared-models';

// #region types
type LolfiJurisdiction = {
  id: string;
  label?: string;
  jurisdictionType?: string;

  /* LolfiJurisdiction.id */
  ressort?: string;
  /* LolfiJurisdiction.id */
  arrondissement?: string;
};

type LolfiFunction = {
  label: string;
  id?: string;
  labelOneMale?: string;
  labelOneFemale?: string;
  formation?: Magistrat.Formation;
};

type LolfiData = {
  sessions: {
    name?: string;
    id?: number;
    createdAt: string;

    candidates: {
      firstName: string;
      lastName: string;
      usedName?: string;
      marriedName?: string;
      rank?: number;
      id?: number;
      civilite?: 'M.' | 'MME';
      position?: {
        grade?: Magistrat.Grade;
        function: LolfiFunction;
        jurisdiction: LolfiJurisdiction;
      };
      targetPosition?: {
        grade?: Magistrat.Grade;
        function: LolfiFunction;
        jurisdiction: LolfiJurisdiction;
      };
    }[];
  }[];
};
// #endregion types

// #region xmlHelpers
function recordToXml(record: Record<string, unknown>): string {
  return Object.entries(record)
    .map(([name, value]) => (value === null ? `<${name} null="TRUE" />` : `<${name}>${value}</${name}>`))
    .join('\n');
}

function toXml<T extends Record<string, unknown>>(type: string, rows: readonly T[]): Buffer {
  const xmlRows = rows
    .map(
      (row, num) => stripIndent`
        <${type} num="${num + 1}">
          ${recordToXml(row)}
        </${type}>`,
    )
    .join('\n');

  const xml = stripIndent /* html */ `
    <?xml version="1.0" encoding="ISO-8859-1"?>
    <lolfi>
      ${xmlRows}
    </lolfi>
  `;

  return Buffer.from(xml);
}
//#endregion xmlHelpers

export function generateLolfiFiles(data: LolfiData): { filename: string; buffer: Buffer }[] {
  const result: { filename: string; buffer: Buffer }[] = [];

  result.push({
    filename: 'POSADS.xml',
    buffer: toXml('posads', [{ posad: 'PT', libelle: 'Plein temps', reel: 0.5 }]),
  });

  // #region jurisdictionTypes
  const jurisdictionTypes = new Set(
    data.sessions.flatMap((session) =>
      session.candidates.flatMap((c) =>
        [c.position, c.targetPosition].flatMap((position) => {
          const jurisdictionType =
            position?.jurisdiction.jurisdictionType || position?.jurisdiction.id.split(' ')[0];
          return jurisdictionType ? [jurisdictionType] : [];
        }),
      ),
    ),
  )
    .values()
    .toArray();

  result.push({
    filename: 'TYPE_JURIDICTION.xml',
    buffer: toXml(
      'type_juridiction',
      jurisdictionTypes.map((jt) => ({ type_jur: jt, libelle: jt, degrejur: 0, tri: 0 })),
    ),
  });

  // GC
  jurisdictionTypes.length = 0;

  // #endregion jurisdictionTypes

  // #region jurisdictions

  const jurisdictions = new Map(
    data.sessions.flatMap((session) =>
      session.candidates.flatMap((c) =>
        [c.position, c.targetPosition].flatMap((position) => {
          const jurisdiction = position?.jurisdiction;
          return jurisdiction ? [[jurisdiction.id, jurisdiction]] : [];
        }),
      ),
    ),
  )
    .values()
    .toArray()
    .map((j, index) => ({
      codejur: j.id,
      type_jur: j.jurisdictionType ?? j.id.split('  ').toSpliced(0, 1, 'CA').join('  '),
      ville_jur: j.id.split('  ').slice(1).join('  '),
      libelle: j.label ?? '',
      ressort: j.ressort || null,
      arrondissement: j.arrondissement || null,
      adr1: null,
      adr2: null,
      codepos: null,
      ville: null,
      teleph: null,
      date_suppression: null,
      srj: 1000 + index,
    }));

  result.push({ filename: 'JURIDICTIONS.xml', buffer: toXml('jurisdictions', jurisdictions) });

  // GC
  jurisdictions.length = 0;

  // #endregion jurisdictions

  // #region magistrats

  let magistratIdCounter = 1;
  const magistratMap = new Map<number, Record<string, unknown>>();

  for (const session of data.sessions) {
    for (const candidate of session.candidates) {
      const id = candidate.id ?? magistratIdCounter++;
      if (magistratMap.has(id)) continue;

      magistratMap.set(id, {
        id,
        civilite: candidate.civilite ?? 'M.',
        nom: candidate.lastName,
        prenom: candidate.firstName,
        nom_marital: candidate.marriedName ?? null,
        nom_usage: candidate.usedName ?? null,
        sit_fam: null,
        email_pro: null,
        date_naiss: null,
        lieu_naiss: null,
        dep_naiss: null,
        grade: candidate.position?.grade ?? null,
        date_grade: null,
        num_emploi_cible: candidate.targetPosition?.function.id ?? null,
        date_installation: null,
        date_nomination: null,
        tableau: new Date().getFullYear(),
        historique: null,
        posad: candidate.position?.function.id ?? null,
        posad_prev: null,
        date_posad_prev: null,
        posad_prev2: null,
        date_posad_prev2: null,
        date_modification: null,
        date_posad_prev_fin: null,
      });
    }
  }

  result.push({
    filename: 'MAGISTRATS.xml',
    buffer: toXml('magistrats', [...magistratMap.values()]),
  });

  // GC
  magistratMap.clear();

  // #endregion magistrats

  return result;
}
