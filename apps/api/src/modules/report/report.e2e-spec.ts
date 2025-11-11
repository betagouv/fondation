import { randomUUID } from 'node:crypto';

import { faker } from '@faker-js/faker';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { type Pool } from 'pg';
import supertest from 'supertest';

import { Gender, ReportFileUsage, Role } from 'shared-models';
import { MainAppConfigurator } from 'src/main.configurator';

import { PrismaService } from '../framework/database';
import { PG_POOL_TOKEN } from '../framework/database/database.constants';
import { RootModule } from '../root.module';
import { SimpleAuthService } from '../simple-auth';

describe('Report E2E', () => {
  let cookie: string;
  let user: { id: string; email: string; password: string };
  let report: { id: string };
  let app: INestApplication;
  let prisma: PrismaService;
  let http: ReturnType<(typeof supertest)['agent']>;

  beforeAll(async () => {
    const container = await Test.createTestingModule({
      imports: [RootModule],
    }).compile();

    app = new MainAppConfigurator(container.createNestApplication())
      .withCookies('secret')
      .configure();

    await app.init();
  });

  afterAll(async () => {
    await app?.get<Pool>(PG_POOL_TOKEN).end();
  });

  beforeEach(async () => {
    prisma = app.get(PrismaService);
    const auth = app.get(SimpleAuthService);

    const email = faker.internet.email();
    const password = faker.string.alphanumeric(24);
    const registeredUser = await auth.registerUser({
      email,
      password,
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      gender: Gender.F,
      role: Role.MEMBRE_COMMUN,
    });

    user = { email, password, id: registeredUser.id };

    await prisma.$transaction(async (tx) => {
      const session = await tx.session.create({
        select: { id: true },
        data: {
          formation: 'PARQUET',
          name: faker.lorem.words(3),
          sessionImportId: randomUUID(),
          typeDeSaisine: 'TRANSPARENCE_GDS',
        },
      });
      const nominationFile = await tx.dossierDeNomination.create({
        select: { id: true },
        data: {
          session_id: session.id,
          dossier_de_nomination_import_id: randomUUID(),
          content: { version: 2, nomMagistrat: faker.person.fullName() },
        },
      });
      const createdReport = await tx.report.create({
        select: { id: true },
        data: {
          formation: 'SIEGE',
          nominationFileId: nominationFile.id,
          reporterId: user.id,
          sessionId: session.id,
        },
      });

      report = { id: createdReport.id };
    });

    http = supertest.agent(app.getHttpServer());

    const loginResponse = await http
      .post('/api/auth/v2/login')
      .send({ email: user.email, password: user.password })
      .expect(HttpStatus.NO_CONTENT);
    cookie = ([] as string[]).concat(
      loginResponse.header['set-cookie'] as string[] | string,
    )[0] as string;
  });

  it('should attach files to a report', async () => {
    await http
      .post(`/api/reports/v2/${report.id}/files`)
      .query({ usage: ReportFileUsage.ATTACHMENT })
      .attach('files', Buffer.alloc(8), {
        contentType: 'image/png',
        filename: 'image.png',
      })
      .set('cookie', cookie)
      .expect(HttpStatus.NO_CONTENT);
  });
});
