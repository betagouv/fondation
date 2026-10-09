// oxlint-disable no-console
import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import type { LolfiArchiveContent } from 'lolfi';

import { test } from '../fixtures.ts';
import * as api from '../generated/api/sdk.ts';
import type {
  ImportNominationSessionFromLodamXlsxDto,
  PaginatedNominationFiles,
  UploadNominationFileAttachmentsDto,
} from '../generated/api/types.ts';
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
        formation: 'PARQUET',
        name: 'Transparence TEST ' + randomUUID(),
        observationClosingDate: '2025-03-01',
      } as const),
    ],
    { type: 'application/json' },
  ) as any;
}

function isoDate(date: { day: number; month: number; year: number }): string {
  return `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
}

function attachmentForm(form: UploadNominationFileAttachmentsDto['form']): UploadNominationFileAttachmentsDto['form'] {
  return new Blob([JSON.stringify(form)], { type: 'application/json' }) as any;
}

const TREVOUX_SESSION: LolfiArchiveContent['sessions'][number] = {
  candidates: [
    {
      firstName: 'ETIENNE',
      lastName: 'TREVOUX',
      position: {
        function: seed.functions.PR,
        grade: 'G3',
        jurisdiction: seed.jurisdictions['CA  LYON'],
      },
      targetPosition: {
        function: seed.functions.PR,
        grade: 'G3',
        jurisdiction: seed.jurisdictions['CA  GRENOBLE'],
      },
    },
  ],
  createdAt: '22/04/2026',
  name: 'Transparence annuelle',
};

test.describe('Session E2E', () => {
  test.describe('Given existing members', () => {
    // These members are matched by the LODAM file auto-affectation logic (firstName + lastName)
    test.beforeEach(async ({ registerUser }) => {
      await registerUser({
        email: `charles.andoche+${randomUUID()}@example.com`,
        firstName: 'Charles',
        gender: 'MALE',
        lastName: 'ANDOCHE',
        password: randomUUID(),
        role: 'MEMBRE_COMMUN',
      });

      await registerUser({
        email: `come.durand+${randomUUID()}@example.com`,
        firstName: 'Côme',
        gender: 'MALE',
        lastName: 'DURAND',
        password: randomUUID(),
        role: 'MEMBRE_DU_PARQUET',
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
        auditionDate: null,
        auditionRequired: true,
        auditionRequirement: 'POSITION',
        auditionTime: null,
        canScheduleAudition: true,
        comment: null,
        content: {
          dateDeNaissance: { day: 9, month: 4, year: 1968 },
          dateEchéance: null,
          datePassageAuGrade: { day: 17, month: 12, year: 2010 },
          datePriseDeFonctionPosteActuel: { day: 1, month: 9, year: 2020 },
          detectedMagistratId: null,
          grade: 'I',
          gradeCible: 'G3',
          historique:
            '- S RODEZ (2ème grade),Dt 08/07/2003. VPR NICE (1er grade),  17/12/2010 (Ins.03/01/2011). - PR MONTLUCON 06/08/2013 (Ins.06/09/2013). - SGSG RIOM 28/10/2016 (Ins.28/10/2016). - PR NARBONNE 14/08/2020 (Ins.01/09/2020).',
          informationCarrière: null,
          isAlertHidden: false,
          jurisdictions: {
            current: null,
            targeted: { id: 'TJ  GRASSE', label: 'Tribunal judiciaire de Grasse' },
          },
          lockedReason: null,
          nomMagistrat: 'ROSELIN PIORIER',
          numeroDeDossier: 1,
          observants: [],
          outcome: null,
          posteActuel: 'Procureur de la République TJ  NARBONNE',
          posteCible: 'Procureur de la République TJ  GRASSE',
          rang: '(10 sur une liste de 12)',
          status: { dates: [], value: 'TO_REPORT' },
          version: 2,
        },
        expectedReportersCount: 2,
        hasAttachment: false,
        hasJurisdictionSheet: false,
        id: expect.any(String),
        isArchived: false,
        memo: null,
        missingEvaluation: false,
        missingEvaluationComment: null,
        observations: [],
        priorities: [],
        reporters: [
          expect.objectContaining({
            firstName: 'côme',
            id: expect.any(String),
            lastName: 'durand',
          }),
        ],
        summary: null,
      } satisfies NominationFile);

      expect(nominationFiles.data!.items).toContainEqual({
        auditionDate: null,
        auditionRequired: true,
        auditionRequirement: 'POSITION',
        auditionTime: null,
        canScheduleAudition: true,
        comment: null,
        content: {
          dateDeNaissance: { day: 20, month: 5, year: 1972 },
          dateEchéance: null,
          datePassageAuGrade: { day: 27, month: 8, year: 2008 },
          datePriseDeFonctionPosteActuel: { day: 2, month: 9, year: 2019 },
          detectedMagistratId: null,
          grade: 'I',
          gradeCible: 'G3',
          historique:
            'SM 10 mois. - DESS politiq et gestion de la sécurité. -Chev ONM, 15/11/2018.-  Auditric Just 28 janvier 1999, PF 1er février 1999. - S Chartres, (2ème grade), 31 juillet 2001, (Installat. 31 août 2001). -  MACJ (2ème grade),  à/c 01/09/2004, Dt 13/08/2004. -  VPRP SAINT DENIS DE LA REUNION (1er grade),  27/08/2008 (Ins.01/09/2008).. - PR GAP 21/06/2013 (Ins.02/09/2013). - PR BEZIERS 17/07/2019 (Ins.02/09/2019).',
          informationCarrière: null,
          isAlertHidden: false,
          jurisdictions: {
            current: null,
            targeted: { id: 'TJ  TOULON', label: 'Tribunal judiciaire de Toulon' },
          },
          lockedReason: null,
          nomMagistrat: 'AZELINE NOEL',
          numeroDeDossier: 2,
          observants: [],
          outcome: null,
          posteActuel: 'Procureur de la République TJ  BEZIERS',
          posteCible: 'Procureur de la République TJ  TOULON',
          rang: '(7 sur une liste de 14)',
          status: { dates: [], value: 'TO_REPORT' },
          version: 2,
        },
        expectedReportersCount: 2,
        hasAttachment: false,
        hasJurisdictionSheet: false,
        id: expect.any(String),
        isArchived: false,
        memo: null,
        missingEvaluation: false,
        missingEvaluationComment: null,
        observations: [],
        priorities: [],
        reporters: expect.arrayContaining([
          expect.objectContaining({
            firstName: 'charles',
            id: expect.any(String),
            lastName: 'andoche',
          }),
          expect.objectContaining({
            firstName: 'côme',
            id: expect.any(String),
            lastName: 'durand',
          }),
        ]),
        summary: null,
      } satisfies NominationFile);
    });

    test('should attach a file to a nomination file and list it', async ({ agent, expect }) => {
      const importResponse = await agent.sessions.createSessionFromLodam({
        body: { file: await lodamFile(), form: lodamForm() },
      });
      const sessionId = importResponse.data!.id;

      const filesBefore = await agent.sessions.listNominationFiles({ path: { sessionId } });
      const nominationFileId = filesBefore.data!.items[0]!.id;

      const fileToAttach = makeFile({ name: 'note.pdf', type: 'application/pdf' });
      const uploadRes = await agent.sessions.uploadNominationFileAttachments({
        body: { files: [fileToAttach], form: attachmentForm({ type: 'FICHE_DE_JURIDICTION' }) },
        path: { nominationFileId, sessionId },
      });
      expect(uploadRes.response?.status).toBe(204);

      const attachments = await agent.sessions.listNominationFileAttachments({
        path: { nominationFileId, sessionId },
      });
      const { data: me } = await agent.auth.introspectSession();
      expect(attachments.response?.status).toBe(200);
      expect(attachments.data!.items).toEqual([
        {
          addedAt: expect.any(String),
          addedBy: { id: me!.userId, name: expect.any(String) },
          id: expect.any(String),
          name: fileToAttach.name,
          size: fileToAttach.size,
          type: 'FICHE_DE_JURIDICTION',
        },
      ]);

      const filesAfter = await agent.sessions.listNominationFiles({ path: { sessionId } });
      const updatedFile = filesAfter.data!.items.find((file) => file.id === nominationFileId);
      expect(updatedFile?.hasAttachment).toBe(true);
      expect(updatedFile?.hasJurisdictionSheet).toBe(true);
    });

    test('should only flag a jurisdiction sheet for that very type', async ({ agent, expect }) => {
      const importResponse = await agent.sessions.createSessionFromLodam({
        body: { file: await lodamFile(), form: lodamForm() },
      });
      const sessionId = importResponse.data!.id;

      const filesBefore = await agent.sessions.listNominationFiles({ path: { sessionId } });
      const nominationFileId = filesBefore.data!.items[0]!.id;

      const uploadRes = await agent.sessions.uploadNominationFileAttachments({
        body: {
          files: [makeFile({ name: 'intention.pdf', type: 'application/pdf' })],
          form: attachmentForm({ type: 'NOTE_INTENTION' }),
        },
        path: { nominationFileId, sessionId },
      });
      expect(uploadRes.response?.status).toBe(204);

      const filesAfter = await agent.sessions.listNominationFiles({ path: { sessionId } });
      const updatedFile = filesAfter.data!.items.find((file) => file.id === nominationFileId);
      expect(updatedFile?.hasAttachment).toBe(true);
      expect(updatedFile?.hasJurisdictionSheet).toBe(false);
    });

    test('should detail a nomination file exactly as the list serves it', async ({ agent, sessions, expect }) => {
      const session = await sessions.createOne(TREVOUX_SESSION);
      const files = await agent.sessions.listNominationFiles({ path: { sessionId: session.id } });
      const listed = files.data!.items[0]!;

      const detailed = await agent.sessions.detailNominationFile({
        path: { nominationFileId: listed.id, sessionId: session.id },
      });

      expect(detailed.response?.status).toBe(200);
      expect(detailed.data).toEqual(listed);
    }, 10_000);

    test('should sort the sessions by due date', async ({ agent, sessions, expect }) => {
      const [later, sooner] = await sessions.createMany([TREVOUX_SESSION, TREVOUX_SESSION]);
      // the earliest due dates of the database, for both sessions to open the list whatever its size
      for (const [session, dueDate] of [
        [later!, '1991-01-01'],
        [sooner!, '1990-01-01'],
      ] as const) {
        const details = await agent.sessions.detailsNominationSession({ path: { sessionId: session.id } });
        const { date, name, observationsClosingDate, positionStartDate } = details.data!;
        await agent.sessions.updateNominationSession({
          body: {
            date: isoDate(date),
            dueDate,
            name,
            observationsClosingDate: isoDate(observationsClosingDate),
            positionStartDate: positionStartDate && isoDate(positionStartDate),
          },
          path: { sessionId: session.id },
          throwOnError: true,
        });
      }

      const listed = await agent.sessions.listSessionsOfTypeGardeDesSceaux({
        query: { limit: 200, sortBy: 'dueDate' },
      });

      // earlier runs leave sessions with the same due dates: only the order of these two is checked
      const ours = new Set([sooner!.id, later!.id]);
      expect(listed.response?.status).toBe(200);
      expect(listed.data!.items.filter(({ id }) => ours.has(id)).map(({ id }) => id)).toEqual([sooner!.id, later!.id]);
    });

    test('should list the nomination files it is asked for', async ({ agent, sessions, expect }) => {
      const session = await sessions.createOne(TREVOUX_SESSION);
      const files = await agent.sessions.listNominationFiles({ path: { sessionId: session.id } });
      const [wanted] = files.data!.items;

      const restricted = await agent.sessions.listNominationFiles({
        path: { sessionId: session.id },
        query: { nominationFileIds: [wanted!.id] },
      });

      expect(restricted.data!.items.map(({ id }) => id)).toEqual([wanted!.id]);
      expect(restricted.data!.totalCount).toBe(1);

      const none = await agent.sessions.listNominationFiles({
        path: { sessionId: session.id },
        query: { nominationFileIds: [randomUUID()] },
      });

      expect(none.data!.items).toEqual([]);
      expect(none.data!.totalCount).toBe(0);
    }, 10_000);

    test('should not detail a nomination file outside of the session', async ({ agent, sessions, expect }) => {
      const session = await sessions.createOne(TREVOUX_SESSION);
      const otherSession = await sessions.createOne(TREVOUX_SESSION);
      const otherFiles = await agent.sessions.listNominationFiles({ path: { sessionId: otherSession.id } });

      const unknown = await agent.sessions.detailNominationFile({
        path: { nominationFileId: randomUUID(), sessionId: session.id },
      });
      expect(unknown.response?.status).toBe(404);

      const foreign = await agent.sessions.detailNominationFile({
        path: { nominationFileId: otherFiles.data!.items[0]!.id, sessionId: session.id },
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
        path: { nominationFileId: files.data!.items[0]!.id, sessionId: session.id },
      });
      expect(forbidden.response?.status).toBe(404);
    }, 10_000);

    test('should write then read back the session comment and who wrote it last', async ({
      agent,
      sessions,
      expect,
    }) => {
      const session = await sessions.createOne(TREVOUX_SESSION);
      const { data: me } = await agent.auth.introspectSession();

      const written = await agent.sessions.writeSessionComment({
        body: { comment: 'Une note pour la notice' },
        path: { sessionId: session.id },
      });
      expect(written.response?.status).toBe(204);

      const { data } = await agent.sessions.detailSessionComment({ path: { sessionId: session.id } });
      expect(data).toEqual({
        comment: 'Une note pour la notice',
        writtenAt: expect.any(String),
        writtenBy: { id: me!.userId, name: expect.any(String) },
      });
    });

    test('should flag then clear a missing evaluation on a nomination file', async ({ agent, sessions, expect }) => {
      const session = await sessions.createOne(TREVOUX_SESSION);

      const missingEvaluationOf = async (nominationFileId: string) => {
        const files = await agent.sessions.listNominationFiles({ path: { sessionId: session.id } });
        return files.data!.items.find(({ id }) => id === nominationFileId)?.missingEvaluation;
      };

      const initial = await agent.sessions.listNominationFiles({ path: { sessionId: session.id } });
      const nominationFileId = initial.data!.items[0]!.id;
      expect(await missingEvaluationOf(nominationFileId)).toBe(false);

      const flagRes = await agent.sessions.updateNominationFileMissingEvaluation({
        body: { missingEvaluation: true },
        path: { nominationFileId, sessionId: session.id },
      });
      expect(flagRes.response?.status).toBe(204);
      expect(await missingEvaluationOf(nominationFileId)).toBe(true);

      const clearRes = await agent.sessions.updateNominationFileMissingEvaluation({
        body: { missingEvaluation: false },
        path: { nominationFileId, sessionId: session.id },
      });
      expect(clearRes.response?.status).toBe(204);
      expect(await missingEvaluationOf(nominationFileId)).toBe(false);
    });

    test('should only list the nomination files with a missing evaluation', async ({ agent, sessions, expect }) => {
      const session = await sessions.createOne(TREVOUX_SESSION);

      const listFlaggedAs = async (missingEvaluation: boolean) => {
        const files = await agent.sessions.listNominationFiles({
          path: { sessionId: session.id },
          query: { missingEvaluation },
        });
        return { ids: files.data!.items.map(({ id }) => id), totalCount: files.data!.totalCount };
      };

      const initial = await agent.sessions.listNominationFiles({ path: { sessionId: session.id } });
      const nominationFileId = initial.data!.items[0]!.id;

      expect(await listFlaggedAs(true)).toEqual({ ids: [], totalCount: 0 });
      expect(await listFlaggedAs(false)).toEqual({
        ids: [nominationFileId],
        totalCount: initial.data!.totalCount,
      });

      await agent.sessions.updateNominationFileMissingEvaluation({
        body: { missingEvaluation: true },
        path: { nominationFileId, sessionId: session.id },
      });

      expect(await listFlaggedAs(true)).toEqual({ ids: [nominationFileId], totalCount: 1 });
      expect(await listFlaggedAs(false)).toEqual({ ids: [], totalCount: 0 });
    });

    test('should export the missing evaluations as a spreadsheet', async ({ agent, sessions, expect }) => {
      const session = await sessions.createOne(TREVOUX_SESSION);

      const initial = await agent.sessions.listNominationFiles({ path: { sessionId: session.id } });
      const nominationFileId = initial.data!.items[0]!.id;

      await agent.sessions.updateNominationFileMissingEvaluation({
        body: { missingEvaluation: true },
        path: { nominationFileId, sessionId: session.id },
      });

      const exported = await agent.sessions.listMissingEvaluationsAsExcel({
        path: { sessionId: session.id },
      });

      expect(exported.response?.status).toBe(200);
      expect(exported.response?.headers.get('content-type')).toContain('spreadsheetml');
    });

    test('should comment a missing evaluation then drop the comment when it is cleared', async ({
      agent,
      sessions,
      expect,
    }) => {
      const session = await sessions.createOne(TREVOUX_SESSION);

      const commentOf = async (nominationFileId: string) => {
        const files = await agent.sessions.listNominationFiles({ path: { sessionId: session.id } });
        return files.data!.items.find(({ id }) => id === nominationFileId)?.missingEvaluationComment;
      };

      const initial = await agent.sessions.listNominationFiles({ path: { sessionId: session.id } });
      const nominationFileId = initial.data!.items[0]!.id;
      expect(await commentOf(nominationFileId)).toBeNull();

      await agent.sessions.updateNominationFileMissingEvaluation({
        body: { missingEvaluation: true },
        path: { nominationFileId, sessionId: session.id },
      });

      const commentRes = await agent.sessions.updateNominationFileMissingEvaluationComment({
        body: { comment: 'Relancée le 12 août' },
        path: { nominationFileId, sessionId: session.id },
      });
      expect(commentRes.response?.status).toBe(204);
      expect(await commentOf(nominationFileId)).toBe('Relancée le 12 août');

      await agent.sessions.updateNominationFileMissingEvaluation({
        body: { missingEvaluation: false },
        path: { nominationFileId, sessionId: session.id },
      });
      expect(await commentOf(nominationFileId)).toBeNull();
    });

    test('should count the missing evaluations and the ones already commented', async ({ agent, sessions, expect }) => {
      const session = await sessions.createOne(TREVOUX_SESSION);

      const counts = async () => {
        const { data } = await agent.sessions.countNominationFilesByStatus({
          path: { sessionId: session.id },
        });
        return data!;
      };

      const initial = await agent.sessions.listNominationFiles({ path: { sessionId: session.id } });
      const nominationFileId = initial.data!.items[0]!.id;
      const total = initial.data!.totalCount;

      expect(await counts()).toMatchObject({ missingEvaluation: 0, missingEvaluationWithComment: 0, total });

      await agent.sessions.updateNominationFileMissingEvaluation({
        body: { missingEvaluation: true },
        path: { nominationFileId, sessionId: session.id },
      });
      expect(await counts()).toMatchObject({ missingEvaluation: 1, missingEvaluationWithComment: 0, total });

      await agent.sessions.updateNominationFileMissingEvaluationComment({
        body: { comment: 'Relancée le 12 août' },
        path: { nominationFileId, sessionId: session.id },
      });
      expect(await counts()).toMatchObject({ missingEvaluation: 1, missingEvaluationWithComment: 1, total });

      await agent.sessions.updateNominationFileMissingEvaluation({
        body: { missingEvaluation: false },
        path: { nominationFileId, sessionId: session.id },
      });
      expect(await counts()).toMatchObject({ missingEvaluation: 0, missingEvaluationWithComment: 0, total });
    });

    test('should not report an empty summary', async ({ agent, sessions, expect }) => {
      const session = await sessions.createOne(TREVOUX_SESSION);

      const summaryOf = async (nominationFileId: string) => {
        const files = await agent.sessions.listNominationFiles({ path: { sessionId: session.id } });
        return files.data!.items.find(({ id }) => id === nominationFileId)?.summary;
      };

      const initial = await agent.sessions.listNominationFiles({ path: { sessionId: session.id } });
      const nominationFileId = initial.data!.items[0]!.id;

      const createRes = await agent.summaries.createSummary({
        path: { nominationFileId, sessionId: session.id },
      });
      expect(createRes.response?.status).toBe(201);
      expect(await summaryOf(nominationFileId)).toBeNull();

      const writeRes = await agent.summaries.writeSummary({
        body: { content: 'Une vraie synthèse' },
        path: { nominationFileId, sessionId: session.id },
      });
      expect(writeRes.response?.status).toBe(204);
      expect(await summaryOf(nominationFileId)).toEqual({
        canRead: true,
        canWrite: true,
        id: nominationFileId,
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
      const summaryPath = { nominationFileId, sessionId: session.id };

      expect((await agent.summaries.createSummary({ path: summaryPath })).response?.status).toBe(201);
      expect((await other.summaries.createSummary({ path: summaryPath })).response?.status).toBe(201);

      const firstWrite = await other.summaries.writeSummary({
        body: { content: 'Synthèse rédigée en premier' },
        path: summaryPath,
      });
      expect(firstWrite.response?.status).toBe(204);

      const concurrentWrite = await agent.summaries.writeSummary({
        body: { content: 'tentative concurrente' },
        path: summaryPath,
      });
      expect(concurrentWrite.response?.status).toBe(403);
    }, 10_000);
  });

  test.describe('Given a member affected to a nomination file', () => {
    let nominationFileId: string;
    let sessionId: string;

    test.beforeEach(async ({ agent, member, sessions }) => {
      const session = await sessions.createOne(TREVOUX_SESSION);
      const files = await agent.sessions.listNominationFiles({ path: { sessionId: session.id } });
      nominationFileId = files.data!.items[0]!.id;
      sessionId = session.id;

      await agent.sessions.affectReporters({
        body: { items: [{ nominationFileId, priorities: [], reporterIds: [member['@user']!.id] }] },
        path: { sessionId },
        throwOnError: true,
      });
      await agent.sessions.publishNominationSessionAffectationsVersion({ path: { sessionId }, throwOnError: true });
    });

    test('should no longer schedule an audition once the outcome is final', async ({ agent, member, expect }) => {
      const openFile = await api.sessions.detailNominationFile({
        client: member['@client'],
        path: { nominationFileId, sessionId },
      });
      expect(openFile.response?.status).toBe(200);
      expect(openFile.data).toMatchObject({ canScheduleAudition: true });

      const outcomeRes = await agent.sessions.defineNominationFileOutcome({
        body: { comment: null, outcome: 'VALIDATED' },
        path: { nominationFileId, sessionId },
      });
      expect(outcomeRes.response?.status).toBe(204);

      const closedFile = await api.sessions.detailNominationFile({
        client: member['@client'],
        path: { nominationFileId, sessionId },
      });
      expect(closedFile.response?.status).toBe(200);
      expect(closedFile.data).toMatchObject({ canScheduleAudition: false });
    });

    test('should show the member an audition once the secretariat publishes it', async ({ agent, member, expect }) => {
      await agent.sessions.updateNominationFileAuditionDate({
        body: { auditionDate: { day: 12, month: 12, year: 2028 }, auditionTime: { hours: 9, minutes: 30 } },
        path: { nominationFileId, sessionId },
        throwOnError: true,
      });
      const beforePublication = await api.sessions.detailNominationFile({
        client: member['@client'],
        path: { nominationFileId, sessionId },
        throwOnError: true,
      });

      await agent.sessions.publishSessionAuditions({ path: { sessionId }, throwOnError: true });
      const afterPublication = await api.sessions.detailNominationFile({
        client: member['@client'],
        path: { nominationFileId, sessionId },
        throwOnError: true,
      });

      expect(beforePublication.data).toMatchObject({ auditionDate: null, auditionRequired: true });
      expect(afterPublication.data).toMatchObject({ auditionDate: { day: 12, month: 12, year: 2028 } });
    });
  });
});
