import assert from 'node:assert';

import { faker as defaultFaker, type Faker } from '@faker-js/faker';
import { format, parse, sub } from 'date-fns';

import { gradeToNumber } from './grade-to-number';
import {
  type LolfiArchiveContent,
  LolfiFormationEnum,
  type LolfiFunction,
  LolfiGradeEnum,
  type LolfiJurisdiction,
  type LolfiPosition,
} from './types';

function recordToXml(record: Record<string, string | number | null | undefined>): string {
  return Object.entries(record)
    .map(([name, value]) =>
      value === null
        ? `<${name} null="TRUE" />`
        : `<${name}>${escapeXml((value ?? '').toString())}</${name}>`,
    )
    .join('\n');
}

/* LOLFI pads the jurisdiction type to 4 characters: "TJ  LYON" but "TPR ABBEVILLE" */
function cityOf(jurisdictionId: string): string | undefined {
  return jurisdictionId.match(/^\S+\s+(.+)$/)?.[1];
}

function escapeXml(text: string): string {
  return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function toXml<T extends Record<string, string | number | null | undefined>>(
  type: string,
  iterable: Iterable<T>,
): string {
  let output = `<?xml version="1.0" encoding="ISO-8859-1"?>
    <lolfi>
  `;

  let i = 0;
  for (const record of iterable) {
    output += /* html */ `
      <${type} num="${++i}">
        ${recordToXml(record)}
      </${type}>
    `;
  }

  return output + '</lolfi>';
}

type JurisdictionType = { id: string; label: string };
type Jurisdiction = {
  arrondissement: string | undefined;
  city: string | undefined;
  id: string;
  jurisdictionType: string;
  label: string;
  postalCode: string | undefined;
  ressort: string;
};
type MagistratFunction = {
  addition: string | undefined;
  formation: LolfiFormationEnum;
  id: string;
  label: string;
  labelOneFemale: string | undefined;
  labelOneMale: string | undefined;
};
type MagistratPosition = {
  functionId: string | null;
  grade: LolfiGradeEnum;
  id: number;
  jurisdictionId: string;
  profile: string | null;
  profileId: string | null;
};

export async function* generateLolfiFiles(
  data: LolfiArchiveContent,
  faker: Faker = defaultFaker,
): AsyncIterable<{ filename: string; buffer: string }> {
  const jurisdictionTypes = new Map<string, JurisdictionType>();
  const jurisdictions = new Map<string, Jurisdiction>();
  const declaredJurisdictions = new Map((data.jurisdictions ?? []).map((j) => [j.id, j]));
  const functions = new Map<string, MagistratFunction>();
  const positions = new Map<string, MagistratPosition>();

  function getOrCreateJurisdictionType(jurisdiction: LolfiJurisdiction) {
    const jt = jurisdiction.jurisdictionType ?? jurisdiction.id.match(/^\S+/)?.[0];
    assert(jt, 'unknown jurisdiction type');

    const existing = jurisdictionTypes.get(jt);
    if (existing) return existing;

    jurisdictionTypes.set(jt, { id: jt, label: jt });
    return { id: jt, label: jt };
  }

  function getOrCreateJurisdiction(jurisdiction: LolfiJurisdiction): Jurisdiction {
    const existing = jurisdictions.get(jurisdiction.id);
    if (existing) return existing;

    if (jurisdiction.id.startsWith('CA')) {
      const fullJurisdiction = {
        ...jurisdiction,
        arrondissement: undefined,
        city: jurisdiction.city,
        jurisdictionType: getOrCreateJurisdictionType(jurisdiction).id,
        label: jurisdiction.label || jurisdiction.id,
        postalCode: jurisdiction.postalCode,
        ressort: jurisdiction.id,
      };

      jurisdictions.set(jurisdiction.id, fullJurisdiction);
      return fullJurisdiction;
    }

    const ressortId = jurisdiction.ressort ?? `CA  ${cityOf(jurisdiction.id) ?? jurisdiction.id}`;
    if (ressortId !== jurisdiction.id) {
      getOrCreateJurisdiction(declaredJurisdictions.get(ressortId) ?? { id: ressortId });
    }

    const fullJurisdiction = {
      ...jurisdiction,
      arrondissement: jurisdiction.arrondissement,
      city: jurisdiction.city,
      jurisdictionType: getOrCreateJurisdictionType(jurisdiction).id,
      label: jurisdiction.label || jurisdiction.id,
      postalCode: jurisdiction.postalCode,
      ressort: ressortId,
    };
    jurisdictions.set(jurisdiction.id, fullJurisdiction);
    return fullJurisdiction;
  }

  function getOrCreateFunction(f: LolfiFunction) {
    const existing = functions.get(f.id);
    if (existing) return existing;

    const fullFunction = {
      ...f,
      addition: f.addition,
      labelOneFemale: f.labelOneFemale,
      labelOneMale: f.labelOneMale,
    };
    functions.set(f.id, fullFunction);
    return fullFunction;
  }

  function getOrCreatePosition(position: LolfiPosition) {
    const f = position.function && getOrCreateFunction(position.function);
    const j = getOrCreateJurisdiction(position.jurisdiction);

    const positionId = `${f?.id}+${j.id}`;
    const existing = positions.get(positionId);
    if (existing) return existing;

    const fullPosition = {
      functionId: f?.id ?? null,
      grade: position.grade ?? 'G3',
      id: faker.number.int({ min: 100, max: 1e6 }),
      jurisdictionId: j.id,
      profile: position.profile ?? null,
      profileId:
        position.profileId !== undefined ? position.profileId : position.profile ? crypto.randomUUID() : null,
    } satisfies MagistratPosition;
    positions.set(positionId, fullPosition);
    return fullPosition;
  }

  for (const t of data.jurisdictionTypes ?? []) jurisdictionTypes.set(t.id, t);
  for (const f of data.functions ?? []) getOrCreateFunction(f);
  for (const j of data.jurisdictions ?? []) getOrCreateJurisdiction(j);

  const fullSessions = data.sessions.map((session) => ({
    ...session,
    id: session.id ?? faker.number.int({ min: 100, max: 1e6 }),
    candidates: session.candidates.map((candidate) => {
      return {
        ...candidate,
        id: candidate.id ?? faker.number.int({ min: 100, max: 1e6 }),
        position: getOrCreatePosition(candidate.position),
        targetPosition: getOrCreatePosition(candidate.targetPosition),
      };
    }),
  }));

  yield {
    filename: 'GRADES.xml',
    buffer: toXml(
      'grades',
      Object.values(LolfiGradeEnum).map((grade) => ({
        grade,
        libelle: grade,
        tri: gradeToNumber(grade),
        masse_grade: grade,
        mg_libelle: grade,
        mg_tri: gradeToNumber(grade),
      })),
    ),
  };

  yield {
    filename: 'FONCTIONS.xml',
    buffer: toXml(
      'fonctions',
      [...functions.values()].map((fn, tri) => ({
        tri,
        fonction: fn.id,
        libelle: fn.label,
        lieufc: fn.formation === 'SIEGE' ? '1' : '2',
        fonction_m: fn.labelOneMale ?? null,
        fonction_mp: null,
        fonction_f: fn.labelOneFemale ?? null,
        fonction_fp: null,
        complement: fn.addition ?? null,
      })),
    ),
  };

  yield {
    filename: 'POSADS.xml',
    buffer: toXml(
      'posads',
      (data.administrativePositions ?? [{ id: 'PT', label: 'Plein temps', rate: 1 }]).map((p) => ({
        posad: p.id,
        libelle: p.label,
        reel: p.rate.toString().replace('.', ','),
      })),
    ),
  };

  yield {
    filename: 'TYPE_JURIDICTION.xml',
    buffer: toXml(
      'type_juridiction',
      jurisdictionTypes.values().map((jt, tri) => ({ type_jur: jt.id, libelle: jt.label, tri })),
    ),
  };

  yield {
    filename: 'JURIDICTIONS.xml',
    buffer: toXml(
      'juridictions',
      jurisdictions.values().map((j) => ({
        codejur: j.id,
        type_jur: j.jurisdictionType,
        adr1: null,
        adr2: null,
        arrondissement: j.arrondissement ?? null,
        codepos: j.postalCode ?? null,
        date_suppression: '01/01/2999',
        libelle: j.label ?? j.id,
        ressort: j.ressort,
        ville_jur: cityOf(j.id) ?? null,
        ville: j.city ?? null,
      })),
    ),
  };

  yield { filename: 'POSTES.xml', buffer: toXml('postes', []) };

  yield {
    filename: 'POSTES_2.xml',
    buffer: toXml(
      'postes_2',
      positions.values().map((pos) => ({
        num_emploi_cible: pos.id,
        profil: pos.profile,
        abrev_profil: pos.profileId,
        bbis: '0',
        codejur: pos.jurisdictionId,
        type_jur: jurisdictions.get(pos.jurisdictionId)!.jurisdictionType,
        masse_grade: pos.grade,
        fonction: pos.functionId,
      })),
    ),
  };

  yield {
    filename: 'SESSIONS.xml',
    buffer: toXml(
      'sessions',
      fullSessions.map((session) => ({
        num_session: session.id,
        libelle: session.label ?? `${session.name ?? 'Transparence'} (${session.id})`,
        date_publication: session.createdAt,
      })),
    ),
  };

  yield {
    filename: 'MAGISTRATS.xml',
    buffer: toXml(
      'magistrats',
      fullSessions.flatMap((session) =>
        session.candidates.map((candidate) => ({
          id: candidate.id,
          civilite: candidate.civilite ?? 'M.',
          nom: candidate.lastName,
          prenom: candidate.firstName,
          nom_marital: candidate.marriedName ?? null,
          nom_usage: candidate.usedName ?? null,
          sit_fam: faker.helpers.arrayElement(['C', 'M', 'P']),
          email_pro:
            candidate.email ??
            faker.internet.email({
              lastName: candidate.lastName.toLowerCase(),
              firstName: candidate.firstName.toLowerCase(),
              provider: 'justice.fr',
            }),
          date_naiss:
            candidate.birthDate ??
            format(
              faker.date.between({
                from: sub(parse(session.createdAt, 'dd/MM/yyyy', new Date()), { years: 64 }),
                to: sub(parse(session.createdAt, 'dd/MM/yyyy', new Date()), { years: 30 }),
              }),
              'dd/MM/yyyy',
            ),
          lieu_naiss: null,
          dep_naiss: null,
          grade: candidate.position.grade,
          date_grade: candidate.gradeDate ?? null,
          num_emploi_cible: candidate.position.id,
          date_installation: candidate.installationDate ?? null,
          date_nomination: candidate.nominationDate ?? null,
          tableau: 2024,
          historique: candidate.careerHistory ?? null,
          posad: candidate.administrativePosition ?? 'PT',
          posad_prev: null,
          date_posad_prev: null,
          posad_prev2: null,
          date_posad_prev2: null,
          date_modification: null,
          date_posad_prev_fin: null,
        })),
      ),
    ),
  };

  yield {
    filename: 'TRANSPARENCES.xml',
    buffer: toXml(
      'transparences',
      fullSessions.flatMap((session) =>
        session.candidates.map((candidate) => ({
          num_session: session.id,
          num_transparence: candidate.id,
          num_emploi_cible: candidate.targetPosition.id,
          type_mouvement: candidate.targetPosition.grade == candidate.position.grade ? 'E' : 'A',
          ta: 2024,
          resultat: candidate.designated === false ? 0 : 1,
          id: candidate.id,
          affectation: candidate.position.id,
          date_grade: null,
          tri_poste: candidate.position.id,
          rang_cand: candidate.rank ?? 1,
        })),
      ),
    ),
  };

  yield {
    filename: 'CANDIDATS.xml',
    buffer: toXml(
      'candidats',
      fullSessions.flatMap((session) =>
        session.candidates.map((candidate) => ({
          id: candidate.id,
          num_candidat: candidate.id,
          demande_conjointe: '0',
          nom_ville_conjoint: null,
          observation: null,
          date_modification: session.createdAt,
          adr1: null,
          adr2: null,
          codepos: null,
          ville: null,
          tel_perso: candidate.phone ?? null,
          mandat: null,
          mandat_conjoint: null,
          prof_conjoint: null,
          article_l111: null,
          obs_num_session: null,
        })),
      ),
    ),
  };

  let desiderataIdCounter = faker.number.int({ min: 100, max: 1e6 });
  yield {
    filename: 'DESIDERATA.xml',
    buffer: toXml(
      'desiderata',
      fullSessions.flatMap((session) =>
        session.candidates.flatMap((candidate) => ({
          num_desiderata: desiderataIdCounter++,
          num_candidat: candidate.id,
          num_emploi_cible: candidate.targetPosition.id,
          date_enregistrement: session.createdAt,
        })),
      ),
    ),
  };
}
