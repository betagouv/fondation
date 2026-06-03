import { createHash, randomInt } from 'node:crypto';

import { faker } from '@faker-js/faker';
import { HttpStatus } from '@nestjs/common';
import { stripIndent } from 'common-tags';
import { format, sub } from 'date-fns';
import JSZip from 'jszip';
import supertest from 'supertest';
import waitForExpect from 'wait-for-expect';

import { Magistrat } from 'shared-models';

import { PrismaJobStatusEnum } from '../../src/generated/prisma/enums';
import { FILE_MIME_TYPES } from '../../src/modules/framework/files';
import { IngestedLolfiArchiveDto } from '../../src/modules/ingest/infrastructure/ingest.dto';
import { DetailedJobDto } from '../../src/modules/ingest/jobs/queries/details-job.query';
import { gradeEnumToSortableTargetedGrade } from '../../src/modules/session/infrastructure/repositories/sortable-targeted-grade';
import { assertIsDefined } from '../../src/utils/is-defined';

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
  id: string;
  label: string;
  formation: Magistrat.Formation;
  labelOneMale?: string;
  labelOneFemale?: string;
  addition?: string;
};

type LolfiPosition = { jurisdiction: LolfiJurisdiction; function: LolfiFunction; grade?: Magistrat.Grade };

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
      position: LolfiPosition;
      targetPosition: LolfiPosition;
    }[];
  }[];
};
// #endregion types

// #region xmlHelpers

function recordToXml(record: Record<string, string | number | null | undefined>): string {
  return Object.entries(record)
    .map(([name, value]) =>
      value === null ? `<${name} null="TRUE" />` : `<${name}>${(value ?? '').toString()}</${name}>`,
    )
    .join('\n');
}

function toXml<T extends Record<string, string | number | null | undefined>>(
  type: string,
  iterable: Iterable<T>,
): string {
  let output = /*html */ `<?xml version="1.0" encoding="ISO-8859-1"?>
    <lolfi>
  `;

  let i = 0;
  for (const record of iterable) {
    output += stripIndent`
      <${type} num="${++i}">
        ${recordToXml(record)}
      </${type}>
    `;
  }

  return output + '</lolfi>';
}
//#endregion xmlHelpers

type JurisdictionType = { id: string; label: string };
type Jurisdiction = {
  id: string;
  label: string;
  ressort: string;
  jurisdictionType: string;
  arrondissement: string | undefined;
};
type MagistratFunction = {
  id: string;
  label: string;
  formation: Magistrat.Formation;
  labelOneMale: string | undefined;
  labelOneFemale: string | undefined;
  addition: string | undefined;
};
type MagistratPosition = { id: number; jurisdictionId: string; functionId: string; grade: Magistrat.Grade };

async function* generateLolfiFiles(data: LolfiData): AsyncIterable<{ filename: string; buffer: string }> {
  const jurisdictionTypes = new Map<string, JurisdictionType>();
  const jurisdictions = new Map<string, Jurisdiction>();
  const functions = new Map<string, MagistratFunction>();
  const positions = new Map<string, MagistratPosition>();

  function getOrCreateJurisdictionType(jurisdiction: LolfiJurisdiction) {
    const jt = assertIsDefined(jurisdiction.id.split('  ')[0], 'unknown jurisdiction type');

    const existing = jurisdictionTypes.get(jt!);
    if (existing) return existing;

    jurisdictionTypes.set(jt, { id: jt, label: jt });
    return { id: jt, label: jt };
  }

  function getOrCreateJurisdiction(jurisdiction: LolfiJurisdiction) {
    const existing = jurisdictions.get(jurisdiction.id);
    if (existing) return existing;

    if (jurisdiction.id.startsWith('CA')) {
      const fullJurisdiction = {
        ...jurisdiction,
        ressort: jurisdiction.id,
        arrondissement: undefined,
        label: jurisdiction.label || jurisdiction.id,
        jurisdictionType: getOrCreateJurisdictionType(jurisdiction).id,
      };

      jurisdictions.set(jurisdiction.id, fullJurisdiction);
      return fullJurisdiction;
    }

    const ressortId = jurisdiction.id.split('  ').toSpliced(0, 1, 'CA').join('  ');
    getOrCreateJurisdiction({
      id: ressortId,
      ressort: ressortId,
      jurisdictionType: 'CA',
      label: `cour d'appel + ${jurisdiction.label}`,
    });

    const fullJurisdiction = {
      ...jurisdiction,
      ressort: ressortId,
      arrondissement: undefined,
      label: jurisdiction.label || jurisdiction.id,
      jurisdictionType: getOrCreateJurisdictionType(jurisdiction).id,
    };
    jurisdictions.set(jurisdiction.id, fullJurisdiction);
    return fullJurisdiction;
  }

  function getOrCreateFunction(f: LolfiFunction) {
    const existing = functions.get(f.id);
    if (existing) return existing;

    const fullFunction = {
      ...f,
      labelOneMale: f.labelOneMale,
      labelOneFemale: f.labelOneFemale,
      addition: f.addition,
    };
    functions.set(f.id, fullFunction);
    return fullFunction;
  }

  function getOrCreatePosition(position: LolfiPosition) {
    const f = getOrCreateFunction(position.function);
    const j = getOrCreateJurisdiction(position.jurisdiction);

    const positionId = `${f.id}+${j.id}`;
    const existing = positions.get(positionId);
    if (existing) return existing;

    const fullPosition = {
      functionId: f.id,
      jurisdictionId: j.id,
      grade: position.grade ?? Magistrat.Grade.G3,
      id: randomInt(100, 1e6),
    };
    positions.set(positionId, fullPosition);
    return fullPosition;
  }

  const fullSessions = data.sessions.map((session) => ({
    ...session,
    id: session.id ?? randomInt(100, 1e6),
    candidates: session.candidates.map((candidate) => {
      return {
        ...candidate,
        id: candidate.id ?? randomInt(100, 1e6),
        position: getOrCreatePosition(candidate.position),
        targetPosition: getOrCreatePosition(candidate.targetPosition),
      };
    }),
  }));

  const grades = Object.values(Magistrat.Grade);
  yield {
    filename: 'GRADES.xml',
    buffer: toXml(
      'grades',
      grades.map((grade) => ({
        grade,
        libelle: grade,
        tri: gradeEnumToSortableTargetedGrade(grade),
        masse_grade: grade,
        mg_libelle: grade,
        mg_tri: gradeEnumToSortableTargetedGrade(grade),
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
        lieufc: fn.formation === Magistrat.Formation.SIEGE ? '1' : '2',
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
    buffer: toXml('posads', [{ posad: 'PT', libelle: 'Plein temps', reel: '1' }]),
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
        codepos: null,
        date_suppression: '01/01/2999',
        libelle: j.label ?? j.id,
        ressort: j.ressort,
        ville_jur: j.id.split('  ').slice(1).join('  '),
        ville: null,
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
        profil: null,
        abrev_profil: null,
        bbis: '0',
        codejur: pos.jurisdictionId,
        type_jur: 'CA',
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
        libelle: `${session.name ?? 'Transparence'} (${session.id})`,
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
          email_pro: faker.internet.email({
            lastName: candidate.lastName.toLowerCase(),
            firstName: candidate.firstName.toLowerCase(),
            provider: 'justice.fr',
          }),
          date_naiss: format(
            faker.date.between({
              from: sub(new Date(), { years: 64 }),
              to: sub(new Date(), { years: 30 }),
            }),
            'dd/MM/yyyy',
          ),
          lieu_naiss: null,
          dep_naiss: null,
          grade: candidate.position.grade,
          date_grade: null,
          num_emploi_cible: candidate.position.id,
          date_installation: null,
          date_nomination: null,
          tableau: 2024,
          historique: null,
          posad: 'PT',
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
          resultat: 1,
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
          tel_perso: null,
          mandat: null,
          mandat_conjoint: null,
          prof_conjoint: null,
          article_l111: null,
          obs_num_session: null,
        })),
      ),
    ),
  };

  let desiderataIdCounter = randomInt(100, 1e6);
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

export async function generateLolfiArchive(data: LolfiData): Promise<Buffer> {
  const archive = new JSZip();

  for await (const file of generateLolfiFiles(data)) {
    // console.debug(file.filename);
    // console.debug(file.buffer);

    const fileContent = Buffer.from(file.buffer, 'latin1');
    archive.file(file.filename, fileContent, { binary: true });

    const hash = createHash('sha256').update(fileContent).digest('hex');
    archive.file(file.filename.replace(/\.xml$/, '.sha256'), hash, {
      binary: false,
    });
  }

  return archive.generateAsync({
    mimeType: FILE_MIME_TYPES.zip,
    type: 'nodebuffer',
    compressionOptions: { level: 0 },
  });
}

export async function createSession(options: {
  cookie: string;
  session: LolfiData['sessions'][number];
  http: ReturnType<typeof supertest.agent>;
}): Promise<{ id: string }> {
  const sessionId = options.session.id || randomInt(100, 1e6);
  const sessionName = `${options.session.name || 'Transparence annuelle'}`;

  const archive = await generateLolfiArchive({
    sessions: [{ ...options.session, name: sessionName, id: sessionId }],
  });

  const ingestionResponse = await options.http
    .post('/api/ingest/v1/lolfi')
    .set({ cookie: options.cookie })
    .attach('file', archive, {
      filename: 'LOLFI_CSM_' + new Date().toISOString() + `.zip`,
      contentType: FILE_MIME_TYPES.zip,
    })
    .expect(HttpStatus.OK);

  const { id: jobId } = ingestionResponse.body as IngestedLolfiArchiveDto;
  await waitForExpect(async () => {
    const jobResponse = await options.http
      .get(`/api/jobs/v1/${jobId}`)
      .set({ cookie: options.cookie })
      .expect(HttpStatus.OK);

    const status: PrismaJobStatusEnum = (jobResponse.body as DetailedJobDto).status;
    if (status === 'FAILED') {
      console.error((jobResponse.body as DetailedJobDto).errors);
      console.error((jobResponse.body as DetailedJobDto).files.map((file) => file.errors));
      expect(status).toBe('FAILED');
    }

    expect(status).toBe('SUCCEEDED' satisfies PrismaJobStatusEnum);
  }, /* timeout */ 2_000);

  const sessionResponse = await options.http
    .get('/api/sessions/v2/garde-des-sceaux')
    .query({ search: `${sessionName} (${sessionId})` })
    .set({ cookie: options.cookie })
    .expect(HttpStatus.OK);

  return { id: assertIsDefined(sessionResponse.body.items[0], `unknown session "${sessionName}"`).id };
}
