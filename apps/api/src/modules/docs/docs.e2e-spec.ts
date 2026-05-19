import { faker } from '@faker-js/faker';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { agent } from 'supertest';

import { Gender, Magistrat, Role } from 'shared-models';

import { AppModule } from 'src/app.module';
import { createSession } from '../../../test/utils/lolfi';
import { AdministrationService } from '../administration/administration.service';
import { ChildProcessJobRunner } from '../ingest/jobs/runner/child-process-job-runner';
import { InProcessJobRunner } from '../ingest/jobs/runner/in-process-job-runner';
import { RootModule } from '../root.module';
import { DefineNominationFileOutcomeDto } from '../session/infrastructure/dtos/nomination-session.dto';
import { SimpleAuthService } from '../simple-auth';
import { LoginDto } from '../simple-auth/infrastructure/dto/auth.dto';

import { CreateOrUpdateAgendaDto, CreatedAgendaDto } from './infrastructure/docs.dto';
import { FoundDocsNominationFiles } from './infrastructure/finders/docs-nomination-files.finder';

describe('Docs Service', () => {
  let app: INestApplication;
  let auth: SimpleAuthService;
  let http: ReturnType<typeof agent>;

  let chairman: { id: string };
  let session: { id: string };
  let user: { id: string; cookie: string; email: string; password: string };

  afterAll(async () => {
    await app?.close();
  });

  beforeAll(async () => {
    const modules = await Test.createTestingModule({ imports: [RootModule] })
      .overrideProvider(ChildProcessJobRunner)
      .useClass(InProcessJobRunner)
      .compile();

    app = AppModule.configure(modules.createNestApplication());
    app.useLogger(['verbose']);

    await app.init();

    auth = app.get(SimpleAuthService);
    http = agent(app.getHttpServer());

    user = {
      id: '',
      cookie: '',
      email: faker.internet
        .email({ lastName: `${faker.person.lastName()}+${crypto.randomUUID()}` })
        .toLowerCase(),
      password: faker.string.alphanumeric({ length: 20 }),
    };

    chairman = await auth.registerUser({
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      gender: Gender.M,
      role: Role.MEMBRE_DU_PARQUET,
      email: faker.internet
        .email({ lastName: `${faker.person.lastName()}+${crypto.randomUUID()}` })
        .toLowerCase(),
      password: faker.string.alphanumeric({ length: 20 }),
    });

    const admin = app.get(AdministrationService);
    await admin.updateRole({ userId: chairman.id, role: 'PRESIDENT_PARQUET' });

    const { id: userId } = await auth.registerUser({
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      gender: Gender.M,
      role: Role.ADMIN,
      email: user.email,
      password: user.password,
    });
    user.id = userId;

    const loginResponse = await http
      .post('/api/auth/v2/login')
      .send(user satisfies LoginDto)
      .expect(HttpStatus.NO_CONTENT);
    user.cookie = loginResponse.headers['set-cookie']!;

    session = await createSession({
      http,
      cookie: user.cookie,
      session: {
        createdAt: '23/04/2026',
        candidates: [
          {
            firstName: 'ANTONIO',
            lastName: 'GRAMSCI',
            civilite: 'M.',
            position: {
              function: {
                id: 'PR',
                label: 'Procureur de la République',
                formation: Magistrat.Formation.PARQUET,
              },
              jurisdiction: { id: 'CA  AMIENS' },
              grade: Magistrat.Grade.G3,
            },
            targetPosition: {
              function: {
                id: 'PR',
                label: 'Procureur de la République',
                formation: Magistrat.Formation.PARQUET,
              },
              jurisdiction: { id: 'CA  REIMS' },
              grade: Magistrat.Grade.G3,
            },
          },
          {
            firstName: 'HANNAH',
            lastName: 'ARENDT',
            civilite: 'MME',
            position: {
              function: {
                label: 'Procureur de la République',
                id: 'PR',
                formation: Magistrat.Formation.PARQUET,
              },
              jurisdiction: { id: 'CA  GRENOBLE' },
              grade: Magistrat.Grade.G3,
            },
            targetPosition: {
              function: {
                label: 'Procureur de la République',
                id: 'PR',
                formation: Magistrat.Formation.PARQUET,
              },
              jurisdiction: { id: 'CA  LYON' },
              grade: Magistrat.Grade.G3,
            },
          },
        ],
      },
    });

    await http
      .post(`/api/sessions/v2/${session.id}/validation`)
      .set({ cookie: user.cookie })
      .expect(HttpStatus.NO_CONTENT);

    await http
      .post(`/api/sessions/v2/${session.id}/files/reporters/versions`)
      .set({ cookie: user.cookie })
      .expect(HttpStatus.NO_CONTENT);
  });

  beforeEach(async () => {
    const response = await http
      .post('/api/auth/v2/login')
      .send(user satisfies LoginDto)
      .expect(HttpStatus.NO_CONTENT);

    user.cookie = response.headers['set-cookie']!;
  });

  it('should prevent creating an agenda with twice the same file', async () => {
    const foundAgendaNominationFiles = await http
      .get(`/api/docs/v1/sessions/${session.id}/files`)
      .set({ cookie: user.cookie })
      .expect(HttpStatus.OK);

    const nominationFiles: FoundDocsNominationFiles = foundAgendaNominationFiles.body;
    expect(nominationFiles.items).toHaveLength(2);

    for (const { id } of nominationFiles.items) {
      await http
        .put(`/api/sessions/v2/${session.id}/files/${id}/outcome`)
        .set({ cookie: user.cookie })
        .send({ comment: null, outcome: 'VALIDATED' } satisfies DefineNominationFileOutcomeDto)
        .expect(HttpStatus.NO_CONTENT);
    }

    const agenda1 = await http
      .post(`/api/docs/v1/sessions/${session.id}/agendas`)
      .set({ cookie: user.cookie })
      .send({
        chairmanId: chairman.id,
        date: { day: 1, month: 2, year: 2026 },
        sessionMeetingDate: { day: 10, month: 2, year: 2026 },
        nominationFileIds: [nominationFiles.items[0]!.id],
      } satisfies CreateOrUpdateAgendaDto)
      .expect(HttpStatus.CREATED);

    expect(agenda1.body as CreatedAgendaDto).toEqual({ id: expect.any(String) });

    const foundAgendaNominationFilesAfter = await http
      .get(`/api/docs/v1/sessions/${session.id}/files`)
      .set({ cookie: user.cookie })
      .expect(HttpStatus.OK);

    const nominationFilesAfter: FoundDocsNominationFiles = foundAgendaNominationFilesAfter.body;
    expect(nominationFilesAfter.items).toHaveLength(1);

    await http
      .post(`/api/docs/v1/sessions/${session.id}/agendas`)
      .set({ cookie: user.cookie })
      .send({
        chairmanId: chairman.id,
        date: { day: 2, month: 2, year: 2026 },
        sessionMeetingDate: { day: 11, month: 2, year: 2026 },
        nominationFileIds: [nominationFiles.items[0]!.id],
      } satisfies CreateOrUpdateAgendaDto)
      .expect(HttpStatus.CONFLICT);
  });
});
