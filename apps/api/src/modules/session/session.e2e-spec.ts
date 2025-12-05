import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

import { faker } from '@faker-js/faker';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { agent } from 'supertest';

import { Gender, Magistrat, Role } from 'shared-models';

import { FILE_MIME_TYPES } from '../framework/files';
import { RootModule } from '../root.module';
import { SimpleAuthService } from '../simple-auth';
import { LoginDto } from '../simple-auth/infrastructure/dto/auth.dto';
import { StatutAffectation } from './domain/statut-affectation.enum';
import { ImportNominationSessionFromLodamXlsxDto } from './infrastructure/dtos/nomination-session.dto';
import { Db } from '../framework/drizzle';
import { MainAppConfigurator } from 'src/main.configurator';

describe('Session E2E', () => {
  const LODAM_FILE_PATH = path.join(
    __dirname,
    '../../../test/assets/lodam/lodam_transparence.xlsx',
  );

  let auth: SimpleAuthService;
  let app: INestApplication;
  let http: ReturnType<typeof agent>;
  let user: { id: string; email: string; password: string; cookie: string };

  afterAll(async () => {
    await app.get(Db).$client.end();
    await app.close();
  });

  beforeAll(async () => {
    const testingModule = await Test.createTestingModule({
      imports: [RootModule],
    }).compile();

    app = new MainAppConfigurator(testingModule.createNestApplication())
      .withCookies()
      .configure();
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
      role: Role.ADJOINT_SECRETAIRE_GENERAL,

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
            } satisfies ImportNominationSessionFromLodamXlsxDto['form']),
          ),
          { filename: 'form.json', contentType: FILE_MIME_TYPES.json },
        )
        .expect(HttpStatus.CREATED);

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
        content: {
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
          grade: 'HH',
          historique:
            '- S RODEZ (2ème grade),Dt 08/07/2003. VPR NICE (1er grade),  17/12/2010 (Ins.03/01/2011). - PR MONTLUCON 06/08/2013 (Ins.06/09/2013). - SGSG RIOM 28/10/2016 (Ins.28/10/2016). - PR NARBONNE 14/08/2020 (Ins.01/09/2020).',
          informationCarrière: null,
          nomMagistrat: 'ROSELIN PIORIER',
          numeroDeDossier: 1,
          observants: [],
          posteActuel: 'Procureur de la République TJ  NARBONNE',
          posteCible: 'Procureur de la République TJ  GRASSE',
          rang: '(10 sur une liste de 12)',
          version: 2,
        },
        id: expect.any(String),
        priority: null,
        reporters: [
          expect.objectContaining({
            firstName: 'Côme',
            id: expect.any(String),
            lastName: 'DURAND',
          }),
        ],
      });

      expect(nominationFiles.body.items).toContainEqual({
        comment: null,
        id: expect.any(String),
        content: {
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
          grade: 'HH',
          historique:
            'SM 10 mois. - DESS politiq et gestion de la sécurité. -Chev ONM, 15/11/2018.-  Auditric Just 28 janvier 1999, PF 1er février 1999. - S Chartres, (2ème grade), 31 juillet 2001, (Installat. 31 août 2001). -  MACJ (2ème grade),  à/c 01/09/2004, Dt 13/08/2004. -  VPRP SAINT DENIS DE LA REUNION (1er grade),  27/08/2008 (Ins.01/09/2008).. - PR GAP 21/06/2013 (Ins.02/09/2013). - PR BEZIERS 17/07/2019 (Ins.02/09/2019).',
          informationCarrière: null,
          nomMagistrat: 'AZELINE NOEL',
          numeroDeDossier: 2,
          observants: ['LAZARE JACQUET'],
          posteActuel: 'Procureur de la République TJ  BEZIERS',
          posteCible: 'Procureur de la République TJ  TOULON',
          rang: '(7 sur une liste de 14)',
          version: 2,
        },
        priority: null,
        reporters: [
          expect.objectContaining({
            id: expect.any(String),
            firstName: 'Charles',
            lastName: 'ANDOCHE',
          }),
          expect.objectContaining({
            id: expect.any(String),
            firstName: 'Côme',
            lastName: 'DURAND',
          }),
        ],
      });
    });
  });
});
