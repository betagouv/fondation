import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { randomUUID } from 'node:crypto';

import supertest from 'supertest';

import { Magistrat } from 'shared-models';

import { registerUser } from '../fixtures/auth.fixture';
import { createSession } from '../fixtures/session.fixture';
import type { PaginatedNominationFiles } from '../generated/api/types';

import { getBaseUrl } from '../fixtures';
const baseUrl = getBaseUrl();
const LODAM_FILE_PATH = path.join(__dirname, '../../assets/lodam/lodam_transparence.xlsx');

type NominationFile = PaginatedNominationFiles['items'][number];

describe('Session E2E', () => {
  const http = supertest(baseUrl);
  let user: { id: string; email: string; password: string; cookie: string };

  beforeEach(async () => {
    const registered = await registerUser(baseUrl, 'ADMIN');
    const loginResponse = await http
      .post('/api/auth/v2/login')
      .send({ email: registered.email, password: registered.password })
      .expect(204);

    user = { ...registered, cookie: loginResponse.headers['set-cookie'] as string };
  });

  describe('Given existing members', () => {
    beforeAll(async () => {
      // These members are matched by the LODAM file auto-affectation logic (firstName + lastName)
      await http
        .post('/api/auth/v2/register')
        .send({
          firstName: 'Charles',
          lastName: 'ANDOCHE',
          role: 'MEMBRE_COMMUN',
          gender: 'M',
          email: `charles.andoche+${randomUUID()}@example.com`,
          password: randomUUID(),
        });

      await http
        .post('/api/auth/v2/register')
        .send({
          firstName: 'Côme',
          lastName: 'DURAND',
          role: 'MEMBRE_DU_PARQUET',
          email: `come.durand+${randomUUID()}@example.com`,
          gender: 'M',
          password: randomUUID(),
        });
    });

    it('should import a session tree from a LODAM file', async () => {
      const fileBuffer = await fs.readFile(LODAM_FILE_PATH);
      const response = await http
        .post('/api/sessions/v2/lodam')
        .set({ cookie: user.cookie })
        .attach('file', fileBuffer, {
          filename: 'transparence.xlsx',
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
        .attach(
          'form',
          Buffer.from(
            JSON.stringify({
              date: '2025-01-01',
              observationClosingDate: '2025-03-01',
              formation: Magistrat.Formation.PARQUET,
              name: 'Transparence TEST ' + randomUUID(),
            }),
          ),
          { filename: 'form.json', contentType: 'application/json' },
        );

      if (response.status === 400) {
        console.error(response.body.errors);
        expect(response.status).toBe(201);
      }

      const { id: sessionId } = response.body;
      expect(sessionId).toBeDefined();

      const lastAffectationVersionMeta = await http
        .get(`/api/sessions/v2/${sessionId}/files/reporters/versions/last`)
        .set({ cookie: user.cookie });
      expect(lastAffectationVersionMeta.body).toMatchObject({
        status: 'BROUILLON',
        version: 1,
      });

      const nominationFiles = await http
        .get(`/api/sessions/v2/${sessionId}/files`)
        .set({ cookie: user.cookie });

      expect(nominationFiles.body.items).toContainEqual({
        comment: null,
        isArchived: false,
        content: {
          numeroDeDossier: 1,
          dateDeNaissance: { day: 9, month: 4, year: 1968 },
          dateEchéance: null,
          datePassageAuGrade: { day: 17, month: 12, year: 2010 },
          datePriseDeFonctionPosteActuel: { day: 1, month: 9, year: 2020 },
          grade: Magistrat.Grade.I,
          gradeCible: Magistrat.Grade.HH,
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
          detectedJurisdictionId: null,
          detectedTargetedFunctionId: null,
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

      expect(nominationFiles.body.items).toContainEqual({
        comment: null,
        id: expect.any(String),
        isArchived: false,
        observations: [],
        content: {
          numeroDeDossier: 2,
          dateDeNaissance: { day: 20, month: 5, year: 1972 },
          dateEchéance: null,
          datePassageAuGrade: { day: 27, month: 8, year: 2008 },
          datePriseDeFonctionPosteActuel: { day: 2, month: 9, year: 2019 },
          grade: Magistrat.Grade.I,
          gradeCible: Magistrat.Grade.HH,
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
          detectedJurisdictionId: null,
          detectedTargetedFunctionId: null,
          isUpdatable: true,
          status: 'TO_REPORT',
        },
        priorities: [],
        memo: null,
        summary: null,
        reporters: expect.arrayContaining([
          expect.objectContaining({ id: expect.any(String), firstName: 'charles', lastName: 'andoche' }),
          expect.objectContaining({ id: expect.any(String), firstName: 'côme', lastName: 'durand' }),
        ]),
        hasAttachment: false,
      } satisfies NominationFile);
    });

    it('should attach a file to a nomination file and list it', async () => {
      const fileBuffer = await fs.readFile(LODAM_FILE_PATH);
      const importResponse = await http
        .post('/api/sessions/v2/lodam')
        .set({ cookie: user.cookie })
        .attach('file', fileBuffer, {
          filename: 'transparence.xlsx',
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
        .attach(
          'form',
          Buffer.from(
            JSON.stringify({
              date: '2025-01-01',
              observationClosingDate: '2025-03-01',
              formation: Magistrat.Formation.PARQUET,
              name: 'Transparence TEST ' + randomUUID(),
            }),
          ),
          { filename: 'form.json', contentType: 'application/json' },
        );
      const { id: sessionId } = importResponse.body;

      const filesBefore = await http
        .get(`/api/sessions/v2/${sessionId}/files`)
        .set({ cookie: user.cookie });
      const nominationFileId: string = filesBefore.body.items[0].id;

      await http
        .put(`/api/sessions/v2/${sessionId}/files/${nominationFileId}/attachments`)
        .set({ cookie: user.cookie })
        .attach('files', Buffer.from('attachment content'), {
          filename: 'note.pdf',
          contentType: 'application/pdf',
        })
        .expect(204);

      const attachments = await http
        .get(`/api/sessions/v2/${sessionId}/files/${nominationFileId}/attachments`)
        .set({ cookie: user.cookie })
        .expect(200);
      expect(attachments.body.items).toEqual([{ id: expect.any(String), name: 'note.pdf' }]);

      const filesAfter = await http
        .get(`/api/sessions/v2/${sessionId}/files`)
        .set({ cookie: user.cookie });
      const updatedFile = filesAfter.body.items.find((file: NominationFile) => file.id === nominationFileId);
      expect(updatedFile.hasAttachment).toBe(true);
    });

    it('should not report an empty summary', async () => {
      const session = await createSession({
        baseUrl,
        cookie: user.cookie,
        session: {
          name: 'Transparence annuelle',
          createdAt: '22/04/2026',
          candidates: [
            {
              firstName: 'ETIENNE',
              lastName: 'TREVOUX',
              position: {
                grade: Magistrat.Grade.G3,
                jurisdiction: { id: 'CA  LYON' },
                function: {
                  id: 'PR',
                  label: 'Procureur de la République',
                  labelOneMale: 'procureur de la République',
                  formation: Magistrat.Formation.PARQUET,
                },
              },
              targetPosition: {
                grade: Magistrat.Grade.G3,
                jurisdiction: { id: 'CA  GRENOBLE' },
                function: {
                  id: 'PR',
                  label: 'Procureur de la République',
                  labelOneMale: 'procureur de la République',
                  formation: Magistrat.Formation.PARQUET,
                },
              },
            },
          ],
        },
      });

      const summaryOf = async (nominationFileId: string) => {
        const { body } = await http
          .get(`/api/sessions/v2/${session.id}/files`)
          .set({ cookie: user.cookie });
        return (body.items as NominationFile[]).find(({ id }) => id === nominationFileId)?.summary;
      };

      const { body: initial } = await http
        .get(`/api/sessions/v2/${session.id}/files`)
        .set({ cookie: user.cookie });
      const { id: nominationFileId } = initial.items[0] as NominationFile;
      const summaryPath = `/api/sessions/v2/${session.id}/files/${nominationFileId}/summary`;

      await http.post(summaryPath).set({ cookie: user.cookie }).expect(201);
      expect(await summaryOf(nominationFileId)).toBeNull();

      await http
        .put(`${summaryPath}/content`)
        .set({ cookie: user.cookie })
        .send({ content: 'Une vraie synthèse' })
        .expect(204);
      expect(await summaryOf(nominationFileId)).toEqual({
        id: nominationFileId,
        canRead: true,
        canWrite: true,
      });
    }, 10_000);

    it('should leave an empty summary authorless and define ownership to first writer', async () => {
      const otherRegistered = await registerUser(baseUrl, 'ADMIN');
      const otherLogin = await http
        .post('/api/auth/v2/login')
        .send({ email: otherRegistered.email, password: otherRegistered.password })
        .expect(204);
      const otherCookie: string = otherLogin.headers['set-cookie']!;

      const session = await createSession({
        baseUrl,
        cookie: user.cookie,
        session: {
          name: 'Transparence annuelle',
          createdAt: '22/04/2026',
          candidates: [
            {
              firstName: 'ETIENNE',
              lastName: 'TREVOUX',
              position: {
                grade: Magistrat.Grade.G3,
                jurisdiction: { id: 'CA  LYON' },
                function: {
                  id: 'PR',
                  label: 'Procureur de la République',
                  labelOneMale: 'procureur de la République',
                  formation: Magistrat.Formation.PARQUET,
                },
              },
              targetPosition: {
                grade: Magistrat.Grade.G3,
                jurisdiction: { id: 'CA  GRENOBLE' },
                function: {
                  id: 'PR',
                  label: 'Procureur de la République',
                  labelOneMale: 'procureur de la République',
                  formation: Magistrat.Formation.PARQUET,
                },
              },
            },
          ],
        },
      });

      const { body: initial } = await http
        .get(`/api/sessions/v2/${session.id}/files`)
        .set({ cookie: user.cookie });
      const { id: nominationFileId } = initial.items[0] as NominationFile;
      const summaryPath = `/api/sessions/v2/${session.id}/files/${nominationFileId}/summary`;

      await http.post(summaryPath).set({ cookie: user.cookie }).expect(201);
      await http.post(summaryPath).set({ cookie: otherCookie }).expect(201);

      await http
        .put(`${summaryPath}/content`)
        .set({ cookie: otherCookie })
        .send({ content: 'Synthèse rédigée en premier' })
        .expect(204);

      await http
        .put(`${summaryPath}/content`)
        .set({ cookie: user.cookie })
        .send({ content: 'tentative concurrente' })
        .expect(403);
    }, 10_000);
  });
});
