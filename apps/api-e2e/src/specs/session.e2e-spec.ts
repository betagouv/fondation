// oxlint-disable no-console
import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import type { LolfiData } from 'lolfi';

import { test } from '../fixtures.ts';
import type { ImportNominationSessionFromLodamXlsxDto, PaginatedNominationFiles } from '../generated/api/types.ts';
import { makeFile } from '../utils/files.ts';
import * as seed from '../utils/seed.ts';

const LODAM_FILE_PATH = fileURLToPath(new URL('../../assets/lodam/lodam_transparence.xlsx', import.meta.url));

type NominationFile = PaginatedNominationFiles['items'][number];

async function lodamFile(): Promise<File> {
  const buffer = await fs.readFile(LODAM_FILE_PATH);
  return new File([buffer], 'transparence.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

function lodamForm(): ImportNominationSessionFromLodamXlsxDto['form'] {
  return new Blob(
    [
      JSON.stringify({
        date: '2025-01-01',
        observationClosingDate: '2025-03-01',
        formation: 'PARQUET',
        name: 'Transparence TEST ' + randomUUID(),
      } as const),
    ],
    { type: 'application/json' },
  ) as any;
}

const TREVOUX_SESSION: LolfiData['sessions'][number] = {
  name: 'Transparence annuelle',
  createdAt: '22/04/2026',
  candidates: [
    {
      firstName: 'ETIENNE',
      lastName: 'TREVOUX',
      position: {
        grade: 'G3',
        jurisdiction: seed.jurisdictions['CA  LYON'],
        function: seed.functions.PR,
      },
      targetPosition: {
        grade: 'G3',
        jurisdiction: seed.jurisdictions['CA  GRENOBLE'],
        function: seed.functions.PR,
      },
    },
  ],
};

test.describe('Session E2E', () => {
  test.describe('Given existing members', () => {
    // These members are matched by the LODAM file auto-affectation logic (firstName + lastName)
    test.beforeEach(async ({ registerUser }) => {
      await registerUser({
        firstName: 'Charles',
        lastName: 'ANDOCHE',
        role: 'MEMBRE_COMMUN',
        gender: 'MALE',
        email: `charles.andoche+${randomUUID()}@example.com`,
        password: randomUUID(),
      });

      await registerUser({
        firstName: 'Côme',
        lastName: 'DURAND',
        role: 'MEMBRE_DU_PARQUET',
        gender: 'MALE',
        email: `come.durand+${randomUUID()}@example.com`,
        password: randomUUID(),
      });
    });

    test('should import a session tree from a LODAM file', async ({ agent, expect }) => {
      const response = await agent.sessions.createSessionFromLodam({
        body: {
          file: await lodamFile(),
          form: lodamForm(),
        },
      });

      if (response.response?.status === 400) {
        // oxlint-disable-next-line no-console
        console.error(response.error);
      }
      expect(response.response?.status).toBe(201);

      const sessionId = response.data!.id;
      expect(sessionId).toBeDefined();

      const lastAffectationVersionMeta = await agent.sessions.detailNominationSessionAffectationsVersion({
        path: { sessionId },
      });
      expect(lastAffectationVersionMeta.data).toMatchObject({
        status: 'BROUILLON',
        version: 1,
      });

      const nominationFiles = await agent.sessions.listNominationFiles({ path: { sessionId } });

      expect(nominationFiles.data!.items).toContainEqual({
        comment: null,
        auditionDate: null,
        auditionTime: null,
        canScheduleAudition: true,
        isArchived: false,
        content: {
          numeroDeDossier: 1,
          dateDeNaissance: { day: 9, month: 4, year: 1968 },
          dateEchéance: null,
          datePassageAuGrade: { day: 17, month: 12, year: 2010 },
          datePriseDeFonctionPosteActuel: { day: 1, month: 9, year: 2020 },
          grade: 'I',
          gradeCible: 'G3',
          historique:
            '- S RODEZ (2ème grade),Dt 08/07/2003. VPR NICE (1er grade),  17/12/2010 (Ins.03/01/2011). - PR MONTLUCON 06/08/2013 (Ins.06/09/2013). - SGSG RIOM 28/10/2016 (Ins.28/10/2016). - PR NARBONNE 14/08/2020 (Ins.01/09/2020).',
          informationCarrière: null,
          nomMagistrat: 'ROSELIN PIORIER',
          observants: [],
          posteActuel: 'Procureur de la République TJ  NARBONNE',
          posteCible: 'Procureur de la République TJ  GRASSE',
          rang: '(10 sur une liste de 12)',
          version: 2,
          outcome: null,
          isAlertHidden: false,
          detectedMagistratId: null,
          detectedJurisdictionId: 'TJ  GRASSE',
          jurisdictions: {
            current: null,
            targeted: { id: 'TJ  GRASSE', label: 'Tribunal judiciaire de Grasse' },
          },
          detectedTargetedFunctionId: 'PR',
          isUpdatable: true,
          status: 'TO_REPORT',
        },
        id: expect.any(String),
        observations: [],
        priorities: [],
        memo: null,
        summary: null,
        reporters: [
          expect.objectContaining({
            firstName: 'côme',
            id: expect.any(String),
            lastName: 'durand',
          }),
        ],
        hasAttachment: false,
      } satisfies NominationFile);

      expect(nominationFiles.data!.items).toContainEqual({
        comment: null,
        auditionDate: null,
        auditionTime: null,
        canScheduleAudition: true,
        id: expect.any(String),
        isArchived: false,
        observations: [],
        content: {
          numeroDeDossier: 2,
          dateDeNaissance: { day: 20, month: 5, year: 1972 },
          dateEchéance: null,
          datePassageAuGrade: { day: 27, month: 8, year: 2008 },
          datePriseDeFonctionPosteActuel: { day: 2, month: 9, year: 2019 },
          grade: 'I',
          gradeCible: 'G3',
          historique:
            'SM 10 mois. - DESS politiq et gestion de la sécurité. -Chev ONM, 15/11/2018.-  Auditric Just 28 janvier 1999, PF 1er février 1999. - S Chartres, (2ème grade), 31 juillet 2001, (Installat. 31 août 2001). -  MACJ (2ème grade),  à/c 01/09/2004, Dt 13/08/2004. -  VPRP SAINT DENIS DE LA REUNION (1er grade),  27/08/2008 (Ins.01/09/2008).. - PR GAP 21/06/2013 (Ins.02/09/2013). - PR BEZIERS 17/07/2019 (Ins.02/09/2019).',
          informationCarrière: null,
          nomMagistrat: 'AZELINE NOEL',
          observants: [],
          posteActuel: 'Procureur de la République TJ  BEZIERS',
          posteCible: 'Procureur de la République TJ  TOULON',
          rang: '(7 sur une liste de 14)',
          version: 2,
          outcome: null,
          isAlertHidden: false,
          detectedMagistratId: null,
          detectedJurisdictionId: 'TJ  TOULON',
          jurisdictions: {
            current: null,
            targeted: { id: 'TJ  TOULON', label: 'Tribunal judiciaire de Toulon' },
          },
          detectedTargetedFunctionId: 'PR',
          isUpdatable: true,
          status: 'TO_REPORT',
        },
        priorities: [],
        memo: null,
        summary: null,
        reporters: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            firstName: 'charles',
            lastName: 'andoche',
          }),
          expect.objectContaining({
            id: expect.any(String),
            firstName: 'côme',
            lastName: 'durand',
          }),
        ]),
        hasAttachment: false,
      } satisfies NominationFile);
    });

    test('should attach a file to a nomination file and list it', async ({ agent, expect }) => {
      const importResponse = await agent.sessions.createSessionFromLodam({
        body: { file: await lodamFile(), form: lodamForm() },
      });
      const sessionId = importResponse.data!.id;

      const filesBefore = await agent.sessions.listNominationFiles({ path: { sessionId } });
      const nominationFileId = filesBefore.data!.items[0]!.id;

      const fileToAttach = makeFile({ type: 'application/pdf', name: 'note.pdf' });
      const uploadRes = await agent.sessions.uploadNominationFileAttachments({
        path: { sessionId, nominationFileId },
        body: { files: [fileToAttach] },
      });
      expect(uploadRes.response?.status).toBe(204);

      const attachments = await agent.sessions.listNominationFileAttachments({
        path: { sessionId, nominationFileId },
      });
      expect(attachments.response?.status).toBe(200);
      expect(attachments.data!.items).toEqual([
        { id: expect.any(String), name: fileToAttach.name, size: fileToAttach.size },
      ]);

      const filesAfter = await agent.sessions.listNominationFiles({ path: { sessionId } });
      const updatedFile = filesAfter.data!.items.find((file) => file.id === nominationFileId);
      expect(updatedFile?.hasAttachment).toBe(true);
    });

    test('should detail a nomination file exactly as the list serves it', async ({ agent, sessions, expect }) => {
      const session = await sessions.createOne(TREVOUX_SESSION);
      const files = await agent.sessions.listNominationFiles({ path: { sessionId: session.id } });
      const listed = files.data!.items[0]!;

      const detailed = await agent.sessions.detailNominationFile({
        path: { sessionId: session.id, nominationFileId: listed.id },
      });

      expect(detailed.response?.status).toBe(200);
      expect(detailed.data).toEqual(listed);
    }, 10_000);

    test('should not detail a nomination file outside of the session', async ({ agent, sessions, expect }) => {
      const session = await sessions.createOne(TREVOUX_SESSION);
      const otherSession = await sessions.createOne(TREVOUX_SESSION);
      const otherFiles = await agent.sessions.listNominationFiles({ path: { sessionId: otherSession.id } });

      const unknown = await agent.sessions.detailNominationFile({
        path: { sessionId: session.id, nominationFileId: randomUUID() },
      });
      expect(unknown.response?.status).toBe(404);

      const foreign = await agent.sessions.detailNominationFile({
        path: { sessionId: session.id, nominationFileId: otherFiles.data!.items[0]!.id },
      });
      expect(foreign.response?.status).toBe(404);
    }, 10_000);

    test('should not detail a session to a member of another formation', async ({ agent, logIn, sessions, expect }) => {
      const session = await sessions.createOne(TREVOUX_SESSION);
      const { data } = await agent.sessions.detailsNominationSession({ path: { sessionId: session.id } });

      const outsider = await logIn(data!.formation === 'PARQUET' ? 'MEMBRE_DU_SIEGE' : 'MEMBRE_DU_PARQUET');
      const forbidden = await outsider.sessions.detailsNominationSession({
        path: { sessionId: session.id },
      });
      expect(forbidden.response?.status).toBe(404);

      const insider = await logIn(data!.formation === 'PARQUET' ? 'MEMBRE_DU_PARQUET' : 'MEMBRE_DU_SIEGE');
      const allowed = await insider.sessions.detailsNominationSession({ path: { sessionId: session.id } });
      expect(allowed.response?.status).toBe(200);
    }, 10_000);

    test('should not serve the files of a session to a member of another formation', async ({
      agent,
      logIn,
      sessions,
      expect,
    }) => {
      const session = await sessions.createOne(TREVOUX_SESSION);
      const { data } = await agent.sessions.detailsNominationSession({ path: { sessionId: session.id } });

      const insider = await logIn(data!.formation === 'PARQUET' ? 'MEMBRE_DU_PARQUET' : 'MEMBRE_DU_SIEGE');
      const files = await insider.sessions.listNominationFiles({ path: { sessionId: session.id } });
      expect(files.data!.items.length).toBeGreaterThan(0);

      const outsider = await logIn(data!.formation === 'PARQUET' ? 'MEMBRE_DU_SIEGE' : 'MEMBRE_DU_PARQUET');
      const hidden = await outsider.sessions.listNominationFiles({ path: { sessionId: session.id } });
      expect(hidden.data!.items).toEqual([]);
      expect(hidden.data!.totalCount).toBe(0);

      const forbidden = await outsider.sessions.detailNominationFile({
        path: { sessionId: session.id, nominationFileId: files.data!.items[0]!.id },
      });
      expect(forbidden.response?.status).toBe(404);
    }, 10_000);

    test('should not report an empty summary', async ({ agent, sessions, expect }) => {
      const session = await sessions.createOne(TREVOUX_SESSION);

      const summaryOf = async (nominationFileId: string) => {
        const files = await agent.sessions.listNominationFiles({ path: { sessionId: session.id } });
        return files.data!.items.find(({ id }) => id === nominationFileId)?.summary;
      };

      const initial = await agent.sessions.listNominationFiles({ path: { sessionId: session.id } });
      const nominationFileId = initial.data!.items[0]!.id;

      const createRes = await agent.summaries.createSummary({
        path: { sessionId: session.id, nominationFileId },
      });
      expect(createRes.response?.status).toBe(201);
      expect(await summaryOf(nominationFileId)).toBeNull();

      const writeRes = await agent.summaries.writeSummary({
        path: { sessionId: session.id, nominationFileId },
        body: { content: 'Une vraie synthèse' },
      });
      expect(writeRes.response?.status).toBe(204);
      expect(await summaryOf(nominationFileId)).toEqual({
        id: nominationFileId,
        canRead: true,
        canWrite: true,
      });
    }, 10_000);

    test('should leave an empty summary authorless and define ownership to first writer', async ({
      logIn,
      agent,
      sessions,
      expect,
    }) => {
      const other = await logIn('ADJOINT_SECRETAIRE_GENERAL');

      const session = await sessions.createOne(TREVOUX_SESSION);

      const initial = await agent.sessions.listNominationFiles({ path: { sessionId: session.id } });
      const nominationFileId = initial.data!.items[0]!.id;
      const summaryPath = { sessionId: session.id, nominationFileId };

      expect((await agent.summaries.createSummary({ path: summaryPath })).response?.status).toBe(201);
      expect((await other.summaries.createSummary({ path: summaryPath })).response?.status).toBe(201);

      const firstWrite = await other.summaries.writeSummary({
        path: summaryPath,
        body: { content: 'Synthèse rédigée en premier' },
      });
      expect(firstWrite.response?.status).toBe(204);

      const concurrentWrite = await agent.summaries.writeSummary({
        path: summaryPath,
        body: { content: 'tentative concurrente' },
      });
      expect(concurrentWrite.response?.status).toBe(403);
    }, 10_000);
  });
});
