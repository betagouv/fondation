import * as fs from 'node:fs/promises';
import * as path from 'node:path';

import { faker } from '@faker-js/faker/locale/fr';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Gender, Role } from 'shared-models';
import { AppModule } from 'src/app.module';
import { agent } from 'supertest';
import { PrismaService } from '../framework/database';
import { FILE_MIME_TYPES } from '../framework/files';
import { SimpleAuthService } from '../simple-auth';
import { AffectReportersDto } from './infrastructure/dtos/nomination-file.dto';
import { ListedMemberSessionsDto } from './infrastructure/queries/internal-list-member-sessions.query';

describe('Session Affectations E2E', () => {
  let app: INestApplication;
  let auth: SimpleAuthService;
  let http: ReturnType<typeof agent>;

  let user: { id: string; cookie: string };
  let member: {
    id: string;
    email: string;
    password: string;
    cookie: string | undefined;
  };

  beforeAll(async () => {
    app = await AppModule.create();
    app.useLogger([]);
    await app.init();

    auth = app.get(SimpleAuthService);
    http = agent(app.getHttpServer());
  });

  afterAll(async () => {
    const prisma = app.get(PrismaService);
    await prisma
      .$executeRawUnsafe(`TRUNCATE nominations_context.session CASCADE`)
      .catch();

    await app.close();
  });

  describe('Given an existing session', () => {
    let sessionId: string;

    beforeAll(async () => {
      await auth
        .registerUser({
          firstName: 'Charles',
          lastName: 'ANDOCHE',
          gender: Gender.M,
          role: Role.MEMBRE_COMMUN,
          email: faker.internet.email(),
          password: faker.string.alphanumeric({ length: 20 }),
        })
        .catch();

      await auth
        .registerUser({
          firstName: 'Côme',
          lastName: 'DURAND',
          gender: Gender.M,
          role: Role.MEMBRE_DU_PARQUET,
          email: faker.internet.email(),
          password: faker.string.alphanumeric({ length: 20 }),
        })
        .catch();

      const partialMember = {
        cookie: undefined,
        email: faker.internet.email(),
        password: faker.string.alphanumeric({ length: 20 }),
      };
      const memberResponse = await auth
        .registerUser({
          ...partialMember,
          firstName: faker.person.firstName(),
          lastName: faker.person.lastName(),
          gender: Gender.M,
          role: Role.MEMBRE_DU_PARQUET,
        })
        .catch();

      member = { ...partialMember, id: memberResponse.id };

      const admin = {
        email: faker.internet.email().toLowerCase(),
        password: faker.string.alphanumeric({ length: 22 }),
      };

      const registeredAdmin = await auth.registerUser({
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        gender: Gender.M,
        role: Role.ADJOINT_SECRETAIRE_GENERAL,
        email: admin.email,
        password: admin.password,
      });

      const loginRes = await http
        .post('/api/auth/v2/login')
        .auth(admin.email, admin.password)
        .expect(HttpStatus.NO_CONTENT);

      user = {
        id: registeredAdmin.id,
        cookie: loginRes.headers['set-cookie'] as string,
      };

      const LODAM_FILE_PATH = path.join(
        __dirname,
        '../../../test/assets/lodam/lodam_transparence.xlsx',
      );
      const fileBuffer = await fs.readFile(LODAM_FILE_PATH);
      const importRes = await http
        .post('/api/sessions/v2/lodam')
        .set({ cookie: user.cookie })
        .attach('file', fileBuffer, {
          filename: 'transparence.xlsx',
          contentType: FILE_MIME_TYPES.xlsx,
        })
        .attach(
          'form',
          Buffer.from(
            JSON.stringify({
              date: '2025-06-01',
              observationClosingDate: '2025-06-07',
              formation: 'PARQUET',
              name: 'Transparence TEST ' + crypto.randomUUID(),
            }),
          ),
          { filename: 'form.json', contentType: FILE_MIME_TYPES.json },
        )
        .expect(HttpStatus.CREATED);

      sessionId = importRes.body.id;
    });

    test("when available, then the session should not appear in the members' list before publishing", async () => {
      const loginRes = await http
        .post(`/api/auth/v2/login`)
        .auth(member.email, member.password)
        .expect(HttpStatus.NO_CONTENT);
      member.cookie = loginRes.headers['set-cookie'] as string;

      const listMemberSessionsRes = await http
        .get(
          `/api/members/v1/${member.id}/sessions/transparence/garde-des-sceaux`,
        )
        .set({ cookie: member.cookie })
        .expect(HttpStatus.OK);

      expect(
        (listMemberSessionsRes.body as ListedMemberSessionsDto).items,
      ).not.toContainEqual({ id: sessionId });
    });

    describe('when the admin publish the session with an affectation', () => {
      beforeAll(async () => {
        const sessionRes = await http
          .get(`/api/sessions/v2/${sessionId}/files`)
          .set({ cookie: user.cookie })
          .expect(HttpStatus.OK);

        const firstFileId = sessionRes.body.items[0]!.id;
        await http
          .post(`/api/sessions/v2/${sessionId}/files/reporters`)
          .set({ cookie: user.cookie })
          .send({
            items: [
              {
                nominationFileId: firstFileId,
                reporterIds: [member.id],
                priorities: [],
              },
            ],
          } satisfies AffectReportersDto)
          .expect(HttpStatus.NO_CONTENT);

        await http
          .post(`/api/sessions/v2/${sessionId}/files/reporters/versions`)
          .set({ cookie: user.cookie })
          .expect(HttpStatus.NO_CONTENT);
      });

      test("then the session should be visible inside the members' list", async () => {
        const loginRes = await http
          .post(`/api/auth/v2/login`)
          .auth(member.email, member.password)
          .expect(HttpStatus.NO_CONTENT);
        member.cookie = loginRes.headers['set-cookie'] as string;

        const listMemberSessionsRes = await http
          .get(
            `/api/members/v1/${member.id}/sessions/transparence/garde-des-sceaux`,
          )
          .set({ cookie: member.cookie })
          .expect(HttpStatus.OK);

        expect(
          (listMemberSessionsRes.body as ListedMemberSessionsDto).items,
        ).toContainEqual(
          expect.objectContaining({
            id: sessionId,
            isAffected: true,
          } satisfies Partial<ListedMemberSessionsDto['items'][number]>),
        );
      });

      describe('and then removes the affectation', () => {
        beforeAll(async () => {
          const sessionRes = await http
            .get(`/api/sessions/v2/${sessionId}/files`)
            .set({ cookie: user.cookie })
            .expect(HttpStatus.OK);

          const firstFileId = sessionRes.body.items[0]!.id;
          await http
            .post(`/api/sessions/v2/${sessionId}/files/reporters`)
            .set({ cookie: user.cookie })
            .send({
              items: [
                {
                  nominationFileId: firstFileId,
                  reporterIds: [],
                  priorities: [],
                },
              ],
            } satisfies AffectReportersDto)
            .expect(HttpStatus.NO_CONTENT);

          await http
            .set({ cookie: user.cookie })
            .post(`/api/sessions/v2/${sessionId}/files/reporters/versions`)
            .expect(HttpStatus.NO_CONTENT);
        });

        test(`then the session should not be visible as affected in the members' list`, async () => {
          const loginRes = await http
            .post(`/api/auth/v2/login`)
            .auth(member.email, member.password)
            .expect(HttpStatus.NO_CONTENT);
          member.cookie = loginRes.headers['set-cookie'] as string;

          const listMemberSessionsRes = await http
            .get(
              `/api/members/v1/${member.id}/sessions/transparence/garde-des-sceaux`,
            )
            .set({ cookie: member.cookie })
            .expect(HttpStatus.OK);

          expect(
            (listMemberSessionsRes.body as ListedMemberSessionsDto).items,
          ).toContainEqual(
            expect.objectContaining({ id: sessionId, isAffected: false }),
          );
        });
      });
    });
  });
});
