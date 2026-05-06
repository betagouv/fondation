import { randomUUID } from 'node:crypto';

import { faker } from '@faker-js/faker';
import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';

import { Gender, Role } from 'shared-models';

import { PrismaService } from '../framework/database';
import { SimpleAuthService } from '../simple-auth';
import { AppModule } from 'src/app.module';

import { DetailedMemberDto } from './infrastructure/queries/details-member.query';

describe('Members E2E', () => {
  let db: PrismaService;
  let app: INestApplication;
  let http: ReturnType<(typeof request)['agent']>;
  let cookie: string;

  const jurisdictions: string[] = [];

  beforeAll(async () => {
    app = await AppModule.create();
    await app.init();

    db = app.get(PrismaService);

    const created = await db.jurisdiction.create({
      data: {
        codejur: 'TGI LYON ' + randomUUID(),
        typeJur: 'TGI',
        adr1: '67 Rue Servient',
        adr2: 'arrondissement: TGI LYON',
        codepos: '69433',
        dateSuppression: new Date('2020-01-01'),
        libelle: 'Tribunal de grande instance de Lyon',
        ressort: 'CA  LYON',
        ville_jur: 'LYON',
        ville: 'Lyon',
      },
      select: { codejur: true },
    });
    jurisdictions.push(created.codejur);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    http = request.agent(app.getHttpServer());
  });

  describe(`Given a user with role ${Role.ADJOINT_SECRETAIRE_GENERAL}`, () => {
    let member: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: Role;
      password: string;
    };

    beforeEach(async () => {
      const auth = app.get(SimpleAuthService);

      const adjoint = {
        role: Role.ADJOINT_SECRETAIRE_GENERAL,
        email: faker.internet.email(),
        password: randomUUID(),
      };
      const memberToCreate = {
        role: Role.MEMBRE_COMMUN,
        email: faker.internet.email(),
        password: randomUUID(),
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
      };

      const { id: memberId } = await auth.registerUser({
        email: memberToCreate.email,
        password: memberToCreate.password,
        role: memberToCreate.role,
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        gender: faker.person.sex() === 'female' ? Gender.F : Gender.M,
      });
      member = { ...memberToCreate, id: memberId };

      await auth.registerUser({
        email: adjoint.email,
        password: adjoint.password,
        role: adjoint.role,
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        gender: faker.person.sex() === 'female' ? Gender.F : Gender.M,
      });

      const response = await http
        .post('/api/auth/v2/login')
        .send(adjoint)
        .expect(HttpStatus.NO_CONTENT)
        .expect('set-cookie', /.+/);
      cookie = response.headers['set-cookie']!;
    });

    it('should update a member excluded jurisdictions', async () => {
      const { body: detailedMemberBefore } = await http.set({ cookie }).get(`/api/members/v1/${member.id}`);

      expect((detailedMemberBefore as DetailedMemberDto).excludedJurisdictions).toEqual([]);

      await http
        .set({ cookie })
        .put(`/api/members/v1/${member.id}/excluded-jurisdictions`)
        .send({ jurisdictionIds: jurisdictions })
        .expect(HttpStatus.NO_CONTENT);

      const { body: detailedMemberAfter } = await http.set({ cookie }).get(`/api/members/v1/${member.id}`);

      expect((detailedMemberAfter as DetailedMemberDto).excludedJurisdictions).toEqual([
        expect.objectContaining({ id: expect.stringMatching(/^TGI LYON/) }),
      ]);
    });
  });

  describe(`Given a user with role ${Role.MEMBRE_COMMUN}`, () => {
    beforeEach(async () => {
      const auth = app.get(SimpleAuthService);
      const email = faker.internet.email();
      const password = randomUUID();

      await auth.registerUser({
        email,
        password,
        role: Role.MEMBRE_COMMUN,
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        gender: faker.person.sex() === 'female' ? Gender.F : Gender.M,
      });

      const response = await http
        .post('/api/auth/v2/login')
        .send({ email, password })
        .expect(HttpStatus.NO_CONTENT);
      cookie = response.headers['set-cookie']!;
    });

    it('should throw', async () => {
      await http.set({ cookie }).get(`/api/members/v1`).expect(HttpStatus.FORBIDDEN);
    });
  });

  describe('Given an unauthenticated user', () => {
    it('should throw', async () => {
      await http.get(`/api/members/v1`).expect(HttpStatus.UNAUTHORIZED);
    });
  });
});
