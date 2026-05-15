import { HttpStatus } from '@nestjs/common';
import { stripIndent } from 'common-tags';
import JSZip from 'jszip';
import { createHash, randomInt } from 'node:crypto';
import { Magistrat } from 'shared-models';
import { PrismaJobStatusEnum } from 'src/generated/prisma/enums';
import { FILE_MIME_TYPES } from 'src/modules/framework/files';
import { IngestedLolfiArchiveDto } from 'src/modules/ingest/infrastructure/ingest.dto';
import { DetailedJobDto } from 'src/modules/ingest/jobs/queries/details-job.query';
import { assertIsDefined } from 'src/utils/is-defined';
import supertest from 'supertest';
import waitForExpect from 'wait-for-expect';

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

function toXml<T extends Record<string, unknown>>(type: string, iterable: Iterable<T>): string {
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

async function* generateLolfiFiles(data: LolfiData): AsyncIterable<{ filename: string; buffer: string }> {
  type Candidate = LolfiData['sessions'][number]['candidates'][number];
  type Position = NonNullable<Candidate['position']>;

  const positionKey = (pos: Position) => `${pos.function.id ?? pos.function.label}::${pos.jurisdiction.id}`;

  const gradeSet = new Set<Magistrat.Grade>([Magistrat.Grade.G3]);
  const functionMap = new Map<string, LolfiFunction>();

  type PositionEntry = {
    numEmploiCible: number;
    codejur: string;
    typeJur: string;
    grade: Magistrat.Grade | null;
    fonction: string | null;
  };
  const positionMap = new Map<string, PositionEntry>();
  const sessionIds = new Map<LolfiData['sessions'][number], number>();
  const magistratIds = new Map<Candidate, number>();

  data.sessions.flatMap((session) =>
    session.candidates.map((candidate) =>
      [candidate.position, candidate.targetPosition].flatMap((position) => {
        if (!position) return [];

        const functionId =
          position.function.id ??
          position.function.label
            .split(' ')
            .map((x) => x[0]?.toUpperCase())
            .join('');
        return [[functionId]];
      }),
    ),
  );

  for (const session of data.sessions) {
    sessionIds.set(session, session.id ?? randomInt(100, 1e6));

    for (const candidate of session.candidates) {
      magistratIds.set(candidate, candidate.id ?? randomInt(100, 1e6));

      for (const pos of [candidate.position, candidate.targetPosition]) {
        if (!pos) continue;

        if (pos.grade) gradeSet.add(pos.grade);

        const fnKey = pos.function.id ?? pos.function.label;
        if (!functionMap.has(fnKey)) functionMap.set(fnKey, pos.function);

        const key = positionKey(pos);
        if (!positionMap.has(key)) {
          const typeJur =
            pos.jurisdiction.jurisdictionType ?? pos.jurisdiction.id.split('  ')[0] ?? pos.jurisdiction.id;
          positionMap.set(key, {
            numEmploiCible: randomInt(100, 1e6),
            codejur: pos.jurisdiction.id,
            typeJur,
            grade: pos.grade ?? null,
            fonction: pos.function.id ?? pos.function.label ?? null,
          });
        }
      }
    }
  }

  // #region grades

  yield {
    filename: 'GRADES.xml',
    buffer: toXml(
      'grades',
      gradeSet
        .values()
        .map((grade, tri) => ({
          grade,
          libelle: grade,
          tri,
          masse_grade: grade,
          mg_libelle: grade,
          mg_tri: tri,
        }))
        .toArray(),
    ),
  };

  gradeSet.clear();

  // #endregion grades

  // #region fonctions

  yield {
    filename: 'FONCTIONS.xml',
    buffer: toXml(
      'fonctions',
      [...functionMap.values()].map((fn, tri) => ({
        fonction: fn.id ?? fn.label,
        libelle: fn.label,
        tri,
        lieufc:
          fn.formation === Magistrat.Formation.SIEGE
            ? '1'
            : fn.formation === Magistrat.Formation.PARQUET
              ? '2'
              : '0',
        fonction_m: fn.labelOneMale ?? null,
        fonction_mp: null,
        fonction_f: fn.labelOneFemale ?? null,
        fonction_fp: null,
        complement: null,
      })),
    ),
  };

  functionMap.clear();

  // #endregion fonctions

  // #region posads

  yield {
    filename: 'POSADS.xml',
    buffer: toXml('posads', [{ posad: 'PT', libelle: 'Plein temps', reel: '1' }]),
  };

  // #endregion posads

  // #region jurisdictionTypes

  const jurisdictionTypes = new Set(
    data.sessions.flatMap((session) =>
      session.candidates.flatMap((c) =>
        [c.position, c.targetPosition].flatMap((position) => {
          const jt = position?.jurisdiction.jurisdictionType || position?.jurisdiction.id.split(' ')[0];
          return jt ? (jt !== 'CA' ? ['CA', jt] : [jt]) : [];
        }),
      ),
    ),
  )
    .values()
    .toArray();

  yield {
    filename: 'TYPE_JURIDICTION.xml',
    buffer: toXml(
      'type_juridiction',
      jurisdictionTypes.map((jt, tri) => ({ type_jur: jt, libelle: jt, tri })),
    ),
  };

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
    .flatMap((j) =>
      j.id.startsWith('CA')
        ? [
            {
              codejur: j.id,
              type_jur: 'CA',
              adr1: null,
              adr2: null,
              arrondissement: null,
              codepos: null,
              date_suppression: '01/01/2999',
              libelle: null,
              ressort: j.id,
              ville_jur: j.id.split('  ').slice(1).join('  '),
              ville: null,
            },
          ]
        : [
            {
              codejur: j.id.split('  ').toSpliced(0, 1, 'CA').join('  '),
              type_jur: 'CA',
              adr1: null,
              adr2: null,
              arrondissement: null,
              codepos: null,
              date_suppression: '01/01/2999',
              libelle: null,
              ressort: j.id.split('  ').toSpliced(0, 1, 'CA').join('  '),
              ville_jur: j.id.split('  ').slice(1).join('  '),
              ville: null,
            },
            {
              codejur: j.id,
              type_jur: j.jurisdictionType ?? j.id.split('  ')[0],
              adr1: null,
              adr2: null,
              arrondissement: j.arrondissement ?? null,
              codepos: null,
              date_suppression: '01/01/2999',
              libelle: j.label ?? null,
              ressort: j.ressort ?? j.id.split('  ').toSpliced(0, 1, 'CA').join('  '),
              ville_jur: j.id.split('  ').slice(1).join('  '),
              ville: null,
            },
          ],
    );

  yield { filename: 'JURIDICTIONS.xml', buffer: toXml('juridictions', jurisdictions) };

  jurisdictions.length = 0;

  // #endregion jurisdictions

  yield { filename: 'POSTES.xml', buffer: toXml('postes', []) };

  // #region postes

  yield {
    filename: 'POSTES_2.xml',
    buffer: toXml(
      'postes_2',
      [...positionMap.values()].map((entry) => ({
        num_emploi_cible: entry.numEmploiCible,
        profil: null,
        abrev_profil: null,
        bbis: '0',
        codejur: entry.codejur,
        type_jur: entry.typeJur,
        masse_grade: entry.grade ?? 'G3',
        fonction: entry.fonction,
      })),
    ),
  };

  // #endregion postes

  // #region sessions

  yield {
    filename: 'SESSIONS.xml',
    buffer: toXml(
      'sessions',
      data.sessions.map((session) => ({
        num_session: sessionIds.get(session),
        libelle: `${session.name ?? 'Transparence'} (${sessionIds.get(session)})`,
        date_publication: session.createdAt,
      })),
    ),
  };

  // #endregion sessions

  // #region magistrats

  const magistratMap = new Map<number, Record<string, unknown>>();

  for (const session of data.sessions) {
    for (const candidate of session.candidates) {
      const id = magistratIds.get(candidate)!;
      if (magistratMap.has(id)) continue;

      const targetPosEntry = candidate.targetPosition
        ? positionMap.get(positionKey(candidate.targetPosition))
        : undefined;

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
        num_emploi_cible: targetPosEntry?.numEmploiCible.toString() ?? null,
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
      });
    }
  }

  yield {
    filename: 'MAGISTRATS.xml',
    buffer: toXml('magistrats', [...magistratMap.values()]),
  };

  magistratMap.clear();

  // #endregion magistrats

  // #region transparences

  const transparenceIds = new Map<Candidate, number>();
  const transparences: Record<string, unknown>[] = [];

  for (const session of data.sessions) {
    const sessionId = sessionIds.get(session)!;
    let transparenceIdCounter = 1;

    for (const candidate of session.candidates) {
      if (!candidate.targetPosition || !candidate.position) continue;

      const targetEntry = positionMap.get(positionKey(candidate.targetPosition));
      const currentEntry = positionMap.get(positionKey(candidate.position));
      if (!targetEntry || !currentEntry) continue;

      const numTransparence = transparenceIdCounter++;
      transparenceIds.set(candidate, numTransparence);

      const rank = candidate.rank ?? 1;

      transparences.push({
        num_transparence: numTransparence,
        num_session: sessionId,
        num_emploi_cible: targetEntry.numEmploiCible,
        type_mouvement: 'E',
        ta: null,
        resultat: 1,
        id: magistratIds.get(candidate),
        affectation: currentEntry.numEmploiCible,
        date_grade: null,
        tri_poste: numTransparence,
        rang_cand: rank,
      });
    }
  }

  yield { filename: 'TRANSPARENCES.xml', buffer: toXml('transparences', transparences) };

  transparences.length = 0;

  // #endregion transparences

  // #region candidats

  let numCandidatCounter = 1;
  const candidatNums = new Map<Candidate, number>();
  const candidats: Record<string, unknown>[] = [];

  for (const session of data.sessions) {
    for (const candidate of session.candidates) {
      const numTransparence = transparenceIds.get(candidate);
      if (!numTransparence) continue;

      const numCandidat = numCandidatCounter++;
      candidatNums.set(candidate, numCandidat);

      candidats.push({
        id: numTransparence,
        num_candidat: numCandidat,
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
      });
    }
  }

  yield { filename: 'CANDIDATS.xml', buffer: toXml('candidats', candidats) };

  candidats.length = 0;

  // #endregion candidats

  // #region desiderata

  let desiderataIdCounter = 1;
  const desiderata: Record<string, unknown>[] = [];

  for (const session of data.sessions) {
    for (const candidate of session.candidates) {
      const numCandidat = candidatNums.get(candidate);
      if (!numCandidat || !candidate.targetPosition) continue;

      const targetEntry = positionMap.get(positionKey(candidate.targetPosition));
      if (!targetEntry) continue;

      desiderata.push({
        num_desiderata: desiderataIdCounter++,
        num_candidat: numCandidat,
        num_emploi_cible: targetEntry.numEmploiCible,
        date_enregistrement: session.createdAt,
      });
    }
  }

  yield { filename: 'DESIDERATA.xml', buffer: toXml('desiderata', desiderata) };

  desiderata.length = 0;

  // #endregion desiderata

  positionMap.clear();
  sessionIds.clear();
  magistratIds.clear();
  transparenceIds.clear();
  candidatNums.clear();
}

export async function generateLolfiArchive(data: LolfiData): Promise<Buffer> {
  const archive = new JSZip();

  for await (const file of generateLolfiFiles(data)) {
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

    expect((jobResponse.body as DetailedJobDto).status).toBe('SUCCEEDED' satisfies PrismaJobStatusEnum);
  }, /* timeout */ 2_000);

  const sessionResponse = await options.http
    .get('/api/sessions/v2/garde-des-sceaux')
    .query({ search: `${sessionName} (${sessionId})` })
    .set({ cookie: options.cookie })
    .expect(HttpStatus.OK);

  return { id: assertIsDefined(sessionResponse.body.items[0], `unknown session "${sessionName}"`).id };
}
