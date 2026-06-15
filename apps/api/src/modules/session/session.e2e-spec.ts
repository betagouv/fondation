import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

import { faker } from '@faker-js/faker';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { agent } from 'supertest';

import { Gender, Magistrat, Role } from 'shared-models';

import { createSession } from '../../../test/utils/lolfi';
import { PrismaService } from '../framework/database';
import { FILE_MIME_TYPES } from '../framework/files';
import { ChildProcessJobRunner } from '../ingest/jobs/runner/child-process-job-runner';
import { InProcessJobRunner } from '../ingest/jobs/runner/in-process-job-runner';
import { RootModule } from '../root.module';
import { SimpleAuthService } from '../simple-auth';
import { LoginDto } from '../simple-auth/infrastructure/dto/auth.dto';
import { AppModule } from 'src/app.module';

import { StatutAffectation } from './domain/statut-affectation.enum';
import { NominationFileAffectationItem } from './infrastructure/queries/list-nomination-files.query';

describe('Session E2E', () => {
  const LODAM_FILES_FOLDER_PATH = path.join(__dirname, '../../../test/assets/lodam');
  const LODAM_FILE_PATH = path.join(LODAM_FILES_FOLDER_PATH, 'lodam_transparence.xlsx');

  let auth: SimpleAuthService;
  let app: INestApplication;
  let http: ReturnType<typeof agent>;
  let user: { id: string; email: string; password: string; cookie: string };

  afterAll(async () => {
    await app.close();
  });

  beforeAll(async () => {
    const modules = await Test.createTestingModule({ imports: [RootModule] })
      .overrideProvider(ChildProcessJobRunner)
      .useClass(InProcessJobRunner)
      .compile();

    app = AppModule.configure(modules.createNestApplication());
    await app.init();

    auth = app.get(SimpleAuthService);
    http = agent(app.getHttpServer());
  });

  beforeEach(async () => {
    user = {
      id: '',
      cookie: '',
      email: faker.internet.email(),
      password: faker.string.alphanumeric({ length: 20 }),
    };
    const { id: userId } = await auth.registerUser({
      email: user.email,
      password: user.password,
      role: Role.ADMIN,

      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      gender: faker.helpers.enumValue(Gender),
    });
    user.id = userId;

    const loginResponse = await http
      .post('/api/auth/v2/login')
      .send(user satisfies LoginDto)
      .expect(HttpStatus.NO_CONTENT);

    user.cookie = loginResponse.headers['set-cookie'] as string;
  });

  describe('Given existing members', () => {
    beforeAll(async () => {
      await auth
        .registerUser({
          firstName: 'Charles',
          lastName: 'ANDOCHE',
          role: Role.MEMBRE_COMMUN,
          gender: Gender.M,
          email: faker.internet.email(),
          password: faker.string.alphanumeric({ length: 20 }),
        })
        .catch();

      await auth
        .registerUser({
          firstName: 'Côme',
          lastName: 'DURAND',
          role: Role.MEMBRE_DU_PARQUET,
          email: faker.internet.email(),
          gender: Gender.M,
          password: faker.string.alphanumeric({ length: 20 }),
        })
        .catch();
    });

    it('should import a session tree from a LODAM file', async () => {
      // Detection resolves the targeted function against the global `function` reference table that
      // other e2e specs ingest (e.g. the "PR" function). Clear it so this assertion stays null
      // regardless of the order specs run in. deleteMany (not TRUNCATE CASCADE) honours the
      // detected_targeted_function_id SET NULL fk leaving other specs' nomination files intact
      await app.get(PrismaService).function.deleteMany();

      const fileBuffer = await fs.readFile(LODAM_FILE_PATH);
      const response = await http
        .post('/api/sessions/v2/lodam')
        .set({ cookie: user.cookie })
        .attach('file', fileBuffer, {
          filename: 'transparence.xslx',
          contentType: FILE_MIME_TYPES.xlsx,
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
          { filename: 'form.json', contentType: FILE_MIME_TYPES.json },
        );

      if (response.status === 400) {
        console.error(response.body.errors);
        expect(response.status).toBe(HttpStatus.CREATED);
      }

      const { id: sessionId } = response.body;
      expect(sessionId).toBeDefined();

      const lastAffectationVersionMeta = await http
        .get(`/api/sessions/v2/${sessionId}/files/reporters/versions/last`)
        .set({ cookie: user.cookie });
      expect(lastAffectationVersionMeta.body).toMatchObject({
        status: StatutAffectation.BROUILLON,
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
          dateDeNaissance: {
            day: 9,
            month: 4,
            year: 1968,
          },
          dateEchéance: null,
          datePassageAuGrade: {
            day: 17,
            month: 12,
            year: 2010,
          },
          datePriseDeFonctionPosteActuel: {
            day: 1,
            month: 9,
            year: 2020,
          },
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
      } satisfies NominationFileAffectationItem);

      expect(nominationFiles.body.items).toContainEqual({
        comment: null,
        id: expect.any(String),
        isArchived: false,
        observations: [],
        content: {
          numeroDeDossier: 2,
          dateDeNaissance: {
            day: 20,
            month: 5,
            year: 1972,
          },
          dateEchéance: null,
          datePassageAuGrade: {
            day: 27,
            month: 8,
            year: 2008,
          },
          datePriseDeFonctionPosteActuel: {
            day: 2,
            month: 9,
            year: 2019,
          },
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
      } satisfies NominationFileAffectationItem);
    });

    // 30s timeout: createSession runs a full LOLFI ingestion (job wait + search retry, up to 6.5s)
    // before the summary requests which overruns the 5s jest default on slow CI runners
    it('should not report an empty summary as a present indicator', async () => {
      const session = await createSession({
        http,
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
        const { body } = await http.get(`/api/sessions/v2/${session.id}/files`).set({ cookie: user.cookie });
        return (body.items as NominationFileAffectationItem[]).find(({ id }) => id === nominationFileId)
          ?.summary;
      };

      const { body: initial } = await http
        .get(`/api/sessions/v2/${session.id}/files`)
        .set({ cookie: user.cookie });
      const { id: nominationFileId } = initial.items[0] as NominationFileAffectationItem;
      const summaryPath = `/api/sessions/v2/${session.id}/files/${nominationFileId}/summary`;

      await http.post(summaryPath).set({ cookie: user.cookie }).expect(HttpStatus.CREATED);
      expect(await summaryOf(nominationFileId)).toBeNull();

      await http
        .put(`${summaryPath}/content`)
        .set({ cookie: user.cookie })
        .send({ content: 'Une vraie synthèse' })
        .expect(HttpStatus.NO_CONTENT);
      expect(await summaryOf(nominationFileId)).toEqual({
        id: nominationFileId,
        canRead: true,
        canWrite: true,
      });
    }, 30_000);
  });
});
