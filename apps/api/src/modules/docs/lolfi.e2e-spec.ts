import { faker } from '@faker-js/faker';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import supertest from 'supertest';

import { Gender, Magistrat, Role } from 'shared-models';

import { AppModule } from 'src/app.module';
import { createSession } from '../../../test/utils/lolfi';
import { ChildProcessJobRunner } from '../ingest/jobs/runner/child-process-job-runner';
import { InProcessJobRunner } from '../ingest/jobs/runner/in-process-job-runner';
import { RootModule } from '../root.module';
import { SimpleAuthService } from '../simple-auth';
import { LoginDto } from '../simple-auth/infrastructure/dto/auth.dto';

let app: INestApplication;
afterAll(() => app?.close());

test('test lolfi', async () => {
  const modules = await Test.createTestingModule({ imports: [RootModule] })
    .overrideProvider(ChildProcessJobRunner)
    .useClass(InProcessJobRunner)
    .compile();

  app = AppModule.configure(modules.createNestApplication());
  app.useLogger(['verbose']);

  await app.init();

  const http = supertest.agent(app.getHttpServer());

  const auth = app.get(SimpleAuthService);

  const user = {
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
