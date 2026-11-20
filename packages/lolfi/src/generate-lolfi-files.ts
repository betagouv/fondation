import assert from 'node:assert';

import { faker as defaultFaker, type Faker } from '@faker-js/faker';
import { format, parse, sub } from 'date-fns';

import { gradeToNumber } from './grade-to-number';
import {
  LOLFI_LEGACY_GRADES,
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
export function cityOf(jurisdictionId: string): string | undefined {
  const typeEnd = jurisdictionId.indexOf(' ');
  if (typeEnd === -1) return undefined;
  return jurisdictionId.slice(typeEnd).trim() || undefined;
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
  const positionIds = new Set<number>();

  function newPositionId(): number {
    const id = faker.number.int({ max: 1e6, min: 100 });
    if (positionIds.has(id)) return newPositionId();
    positionIds.add(id);
    return id;
  }

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

    const grade = position.grade ?? 'G3';
    const positionId = [f?.id, j.id, grade, position.profile, position.seat].join('+');
    const existing = positions.get(positionId);
    if (existing) return existing;

    const fullPosition = {
      functionId: f?.id ?? null,
      grade,
      id: newPositionId(),
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
    candidates: session.candidates.map((candidate) => {
      return {
        ...candidate,
        id: candidate.id ?? faker.number.int({ max: 1e6, min: 100 }),
        position: getOrCreatePosition(candidate.position),
        targetPosition: getOrCreatePosition(candidate.targetPosition),
      };
    }),
    id: session.id ?? faker.number.int({ max: 1e6, min: 100 }),
  }));

  const absentMagistratIds = new Set(data.absentMagistratIds);
  const otherMagistrats = (data.magistrats ?? []).map((magistrat) => ({
    ...magistrat,
    position: getOrCreatePosition(magistrat.position),
  }));
  const legacyGrades = LOLFI_LEGACY_GRADES.filter(
    (grade) =>
      otherMagistrats.some((m) => m.legacyGrade === grade) ||
      fullSessions.some((s) => s.candidates.some((c) => c.legacyGrade === grade)),
  );

  const magistrats = new Map(
    fullSessions.flatMap((session) =>
      session.candidates.map((candidate) => [candidate.id, { candidate, session }] as const),
    ),
  );

  yield {
    buffer: toXml(
      'grades',
      [
        ...Object.values(LolfiGradeEnum).map((grade) => ({ grade, tri: gradeToNumber(grade) })),
        ...legacyGrades.map((grade, index) => ({ grade, tri: gradeToNumber('G1') + 1 + index })),
      ].map(({ grade, tri }) => ({
        grade,
        libelle: grade,
        masse_grade: grade,
        mg_libelle: grade,
        mg_tri: tri,
        tri,
      })),
    ),
    filename: 'GRADES.xml',
  };

  yield {
    buffer: toXml(
      'fonctions',
      [...functions.values()].map((fn, tri) => ({
        complement: fn.addition ?? null,
        fonction: fn.id,
        fonction_f: fn.labelOneFemale ?? null,
        fonction_fp: null,
        fonction_m: fn.labelOneMale ?? null,
        fonction_mp: null,
        libelle: fn.label,
        lieufc: fn.formation === 'SIEGE' ? '1' : '2',
        tri,
      })),
    ),
    filename: 'FONCTIONS.xml',
  };

  yield {
    buffer: toXml(
      'posads',
      (
        data.administrativePositions ?? [
          { id: 'CPR', label: 'Congé parental', rate: 1 },
          { id: 'D47-2', label: 'Dispo. conjoint ou PACS', rate: 0 },
          { id: 'DET', label: 'Détachement', rate: 1 },
          { id: 'PT', label: 'Plein temps', rate: 1 },
        ]
      ).map((p) => ({
        libelle: p.label,
        posad: p.id,
        reel: p.rate.toString().replace('.', ','),
      })),
    ),
    filename: 'POSADS.xml',
  };

  yield {
    buffer: toXml(
      'type_juridiction',
      jurisdictionTypes.values().map((jt, tri) => ({ libelle: jt.label, tri, type_jur: jt.id })),
    ),
    filename: 'TYPE_JURIDICTION.xml',
  };

  yield {
    buffer: toXml(
      'juridictions',
      jurisdictions.values().map((j) => ({
        adr1: null,
        adr2: null,
        arrondissement: j.arrondissement ?? null,
        codejur: j.id,
        codepos: j.postalCode ?? null,
        date_suppression: '01/01/2999',
        libelle: j.label ?? j.id,
        ressort: j.ressort,
        type_jur: j.jurisdictionType,
        ville: j.city ?? null,
        ville_jur: cityOf(j.id) ?? null,
      })),
    ),
    filename: 'JURIDICTIONS.xml',
  };

  yield { buffer: toXml('postes', []), filename: 'POSTES.xml' };

  yield {
    buffer: toXml(
      'postes_2',
      positions.values().map((pos) => ({
        abrev_profil: pos.profileId,
        bbis: '0',
        codejur: pos.jurisdictionId,
        fonction: pos.functionId,
        masse_grade: pos.grade,
        num_emploi_cible: pos.id,
        profil: pos.profile,
        type_jur: jurisdictions.get(pos.jurisdictionId)!.jurisdictionType,
      })),
    ),
    filename: 'POSTES_2.xml',
  };

  yield {
    buffer: toXml(
      'sessions',
      fullSessions.map((session) => ({
        date_publication: session.createdAt,
        libelle: session.label ?? `${session.name ?? 'Transparence'} (${session.id})`,
        num_session: session.id,
      })),
    ),
    filename: 'SESSIONS.xml',
  };

  yield {
    buffer: toXml(
      'magistrats',
      [
        ...magistrats.values(),
        ...otherMagistrats.map((candidate) => ({ candidate, session: { createdAt: '01/01/2026' } })),
      ]
        .filter(({ candidate }) => !absentMagistratIds.has(candidate.id))
        .map(({ candidate, session }) => ({
          civilite: candidate.civilite ?? 'M.',
          date_grade: candidate.gradeDate ?? null,
          date_installation: candidate.installationDate ?? null,
          date_modification: null,
          date_naiss:
            candidate.birthDate ??
            format(
              faker.date.between({
                from: sub(parse(session.createdAt, 'dd/MM/yyyy', new Date()), { years: 64 }),
                to: sub(parse(session.createdAt, 'dd/MM/yyyy', new Date()), { years: 30 }),
              }),
              'dd/MM/yyyy',
            ),
          date_nomination: candidate.nominationDate ?? null,
          date_posad_prev: null,
          date_posad_prev2: null,
          date_posad_prev_fin: null,
          dep_naiss: null,
          email_pro:
            candidate.email !== undefined
              ? candidate.email
              : faker.internet.email({
                  firstName: candidate.firstName.toLowerCase(),
                  lastName: candidate.lastName.toLowerCase(),
                  provider: 'justice.fr',
                }),
          grade: candidate.legacyGrade ?? candidate.position.grade,
          historique: candidate.careerHistory ?? null,
          id: candidate.id,
          lieu_naiss: null,
          nom: candidate.lastName,
          nom_marital: candidate.marriedName ?? null,
          nom_usage: candidate.usedName ?? null,
          num_emploi_cible: candidate.position.id,
          posad: candidate.administrativePosition ?? 'PT',
          posad_prev: null,
          posad_prev2: null,
          prenom: candidate.firstName,
          sit_fam:
            candidate.maritalStatus === undefined
              ? faker.helpers.arrayElement(['C', 'M', 'P'])
              : candidate.maritalStatus,
          tableau: 2024,
        })),
    ),
    filename: 'MAGISTRATS.xml',
  };

  yield {
    buffer: toXml(
      'transparences',
      fullSessions.flatMap((session) =>
        session.candidates.map((candidate) => ({
          affectation: candidate.position.id,
          date_grade: null,
          id: candidate.id,
          num_emploi_cible: candidate.targetPosition.id,
          num_session: session.id,
          num_transparence: candidate.nominationId ?? candidate.id,
          rang_cand: candidate.rank ?? 1,
          resultat: candidate.designated === false ? 0 : 1,
          ta: 2024,
          tri_poste: candidate.positionSort ?? candidate.position.id,
          type_mouvement:
            candidate.targetPosition.grade == (candidate.legacyGrade ?? candidate.position.grade) ? 'E' : 'A',
        })),
      ),
    ),
    filename: 'TRANSPARENCES.xml',
  };

  yield {
    buffer: toXml(
      'candidats',
      magistrats.values().map(({ candidate, session }) => ({
        adr1: null,
        adr2: null,
        article_l111: null,
        codepos: null,
        date_modification: session.createdAt,
        demande_conjointe: '0',
        id: candidate.id,
        mandat: null,
        mandat_conjoint: null,
        nom_ville_conjoint: null,
        num_candidat: candidate.id,
        obs_num_session: null,
        observation: null,
        prof_conjoint: null,
        tel_perso: candidate.phone ?? null,
        ville: null,
      })),
    ),
    filename: 'CANDIDATS.xml',
  };

  let desiderataIdCounter = faker.number.int({ max: 1e6, min: 100 });
  yield {
    buffer: toXml(
      'desiderata',
      fullSessions.flatMap((session) =>
        session.candidates.flatMap((candidate) => ({
          date_enregistrement: session.createdAt,
          num_candidat: candidate.id,
          num_desiderata: desiderataIdCounter++,
          num_emploi_cible: candidate.targetPosition.id,
        })),
      ),
    ),
    filename: 'DESIDERATA.xml',
  };
}
