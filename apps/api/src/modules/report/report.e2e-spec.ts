import { randomUUID } from 'node:crypto';

import { faker } from '@faker-js/faker';
import { HttpStatus, INestApplication } from '@nestjs/common';

import { Gender, ReportFileUsage, Role } from 'shared-models';

import { PrismaService } from '../framework/database';
import { SimpleAuthService } from '../simple-auth';

describe('Report E2E', () => {
  let cookie: string;
  let user: { id: string; email: string; password: string };
  let report: { id: string };
  let app: INestApplication;
  let prisma: PrismaService;
  let http: ReturnType<(typeof supertest)['agent']>;

  beforeEach(async ({}) => {
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
          date: new Date(),
          observationsClosingDate: new Date(),
        },
      });
      const nominationFile = await tx.dossierDeNomination.create({
        select: { id: true },
        data: {
          sessionId: session.id,
          name: faker.person.fullName(),
          sortableTargetedGrade: 0,
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
    cookie = ([] as string[]).concat(loginResponse.header['set-cookie'] as string[] | string)[0] as string;
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

  it('should detach files from a report', async () => {
    await http
      .post(`/api/reports/v2/${report.id}/files`)
      .query({ usage: ReportFileUsage.ATTACHMENT })
      .attach('files', Buffer.alloc(8), {
        contentType: 'image/png',
        filename: 'image_1.png',
      })
      .attach('files', Buffer.alloc(8), {
        contentType: 'image/png',
        filename: 'image_2.png',
      })
      .set('cookie', cookie)
      .expect(HttpStatus.NO_CONTENT);

    const filesCountBefore = await prisma.reportFile.count({
      where: { reportId: report.id },
    });
    expect(filesCountBefore).toBe(2);

    await http
      .delete(`/api/reports/v2/${report.id}/files`)
      .query({ fileNames: 'image_1.png' })
      .set('cookie', cookie)
      .expect(HttpStatus.NO_CONTENT);

    const filesAfter = await prisma.reportFile.findMany({
      where: { reportId: report.id },
      select: { file: { select: { name: true } } },
    });

    expect(filesAfter.length).toBe(1);
    expect(filesAfter.map(({ file }) => file.name)).toEqual(['image_2.png']);
  });
});
