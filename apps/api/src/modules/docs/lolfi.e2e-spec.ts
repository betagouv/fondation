import * as crypto from 'node:crypto';

import { faker } from '@faker-js/faker';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { generateLolfiArchive, LolfiData } from 'lolfi';
import supertest from 'supertest';

import { Gender, Magistrat, Role } from 'shared-models';

import { createSession } from '../../../test/utils/lolfi';
import { FILE_MIME_TYPES } from '../framework/files';
import { ChildProcessJobRunner } from '../ingest/jobs/runner/child-process-job-runner';
import { InProcessJobRunner } from '../ingest/jobs/runner/in-process-job-runner';
import { RootModule } from '../root.module';
import { SimpleAuthService } from '../simple-auth';
import { LoginDto } from '../simple-auth/infrastructure/dto/auth.dto';
import { AppModule } from 'src/app.module';

describe('lolfi', () => {
  let app: INestApplication;
  let http: ReturnType<typeof supertest.agent>;
  let user: { id: string; cookie: string; email: string; password: string };

  afterAll(() => app?.close());

  beforeAll(async () => {
    const modules = await Test.createTestingModule({ imports: [RootModule] })
      .overrideProvider(ChildProcessJobRunner)
      .useClass(InProcessJobRunner)
      .compile();

    app = AppModule.configure(modules.createNestApplication());
    app.useLogger(['verbose']);

    await app.init();

    http = supertest.agent(app.getHttpServer());

    const auth = app.get(SimpleAuthService);

    user = {
      id: '',
      cookie: '',
      email: faker.internet.email({ lastName: `${faker.person.lastName()}+${crypto.randomUUID()}` }),
      password: faker.string.alphanumeric({ length: 20 }),
    };

    const registered = await auth.registerUser({
      role: Role.ADMIN,
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: user.email,
      password: user.password,
      gender: Gender.M,
    });
    user.id = registered.id;

    const authResponse = await http
      .post('/api/auth/v2/login')
      .send(user satisfies LoginDto)
      .expect(HttpStatus.NO_CONTENT);

    user.cookie = authResponse.headers['set-cookie']!;
  });

  it('should import a session from lolfi', async () => {
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

    expect(session).toEqual({ id: expect.any(String) });
  });

  it('should define a PROFILE priority', async () => {
    const session = await createSession({
      http,
      cookie: user.cookie,

      session: {
        name: `Transparence annuelle (${crypto.randomUUID()})`,
        createdAt: '22/04/2026',
        candidates: [
          {
            id: crypto.randomInt(1_000, 9_999),
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
              profile: `profil assise`,
              profileId: null,
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

    const { body: sessionFiles } = await http
      .set({ cookie: user.cookie })
      .get(`/api/sessions/v2/${session.id}/files`);

    expect(sessionFiles.items[0].priorities).toEqual(['PROFILE']);
  });

  it('should update an existing session', async () => {
    const lolfiSession = { name: crypto.randomUUID(), id: crypto.randomInt(1_000, 900_000) };
    const initialSession: LolfiData['sessions'][number] = {
      id: lolfiSession.id,
      name: lolfiSession.name,
      createdAt: '22/04/2026',
      candidates: [
        {
          id: crypto.randomInt(1_000, 9_999),
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
    };

    const session = await createSession({
      http,
      cookie: user.cookie,
      session: initialSession,
    });

    const nextSession = { id: crypto.randomInt(1_000, 900_000), name: crypto.randomUUID() };
    const archive = await generateLolfiArchive({
      sessions: [
        initialSession,
        {
          id: nextSession.id,
          name: nextSession.name,
          createdAt: '23/04/2026',
          candidates: [
            {
              firstName: 'MICHEL',
              lastName: 'BERGER',
              position: {
                function: { id: 'P', formation: 'SIEGE', label: 'président' },
                jurisdiction: { id: 'TJ  LYON' },
              },
              targetPosition: {
                function: { id: 'P', formation: 'SIEGE', label: 'président' },
                jurisdiction: { id: 'TJ  CANNES' },
              },
            },
          ],
        },
      ],
    });

    const { body: ingestionBody } = await http
      .post('/api/ingest/v1/lolfi')
      .set({ cookie: user.cookie })
      .attach('file', archive, {
        filename: 'LOLFI_CSM_' + new Date().toISOString() + `.zip`,
        contentType: FILE_MIME_TYPES.zip,
      })
      .expect(HttpStatus.OK);
    const jobId = ingestionBody.id;

    let nextSessionId: string;
    await expect
      .poll(async () => {
        const { body: job } = await http
          .get(`/api/jobs/v1/${jobId}`)
          .set({ cookie: user.cookie })
          .expect(HttpStatus.OK);
        expect(job.status).toBe('SUCCEEDED');

        const { body: sessions } = await http
          .get('/api/sessions/v2/garde-des-sceaux')
          .set({ cookie: user.cookie })
          .query({ search: `${nextSession.name} (${nextSession.id})` })
          .expect(HttpStatus.OK);
        expect(sessions.items[0]).toBeDefined();

        nextSessionId = sessions.items[0].id;
        return nextSessionId;
      })
      .toBeDefined();

    const sessionResponse = await http
      .set({ cookie: user.cookie })
      .get(`/api/sessions/v2/${session.id}/files`)
      .expect(HttpStatus.OK);
    expect(sessionResponse.body.totalCount).toBe(1);

    const nextSessionResponse = await http
      .set({ cookie: user.cookie })
      .get(`/api/sessions/v2/${nextSessionId!}/files`)
      .expect(HttpStatus.OK);
    expect(nextSessionResponse.body.totalCount).toBe(1);
  });
});
