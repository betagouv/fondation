import { faker } from '@faker-js/faker';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import { Gender, Role } from 'shared-models';
import { IdentityAndAccessModule } from 'src/identity-and-access-context/adapters/primary/nestjs/identity-and-access.module';
import { RegisterUserUseCase } from 'src/identity-and-access-context/business-logic/use-cases/user-registration/register-user.use-case';
import { MainAppConfigurator } from 'src/main.configurator';
import { assertIsDefined } from 'src/utils/is-defined';
import request from 'supertest';
import { Db } from '../framework/drizzle';
import { drizzleJurisdiction } from '../framework/drizzle/schemas';
import { RootModule } from '../root.module';
import { DetailedMemberDto } from './infrastructure/queries/details-member.query';
import { MemberListItemDto } from './infrastructure/queries/list-members.query';

describe('Members E2E', () => {
  let db: Db;
  let app: INestApplication;
  let http: ReturnType<(typeof request)['agent']>;
  let cookie: string;

  beforeAll(async () => {
    const container = await Test.createTestingModule({
      imports: [RootModule, IdentityAndAccessModule],
    }).compile();
    app = new MainAppConfigurator(container.createNestApplication())
      .withCookies()
      .configure();
    await app.init();

    db = app.get(Db);

    await db
      .insert(drizzleJurisdiction)
      .values({
        codejur: 'TGI LYON',
        type_jur: 'TGI',
        adr1: '67 Rue Servient',
        adr2: 'arrondissement: TGI LYON',
        codepos: '69433',
        date_suppression: new Date('2020-01-01'),
        libelle: 'Tribunal de grande instance de Lyon',
        ressort: 'CA  LYON',
        ville_jur: 'LYON',
        ville: 'Lyon',
      })
      .onConflictDoNothing();
  });

  afterAll(async () => {
    await app.close();
    await db.$client.end();
  });

  beforeEach(() => {
    http = request.agent(app.getHttpServer());
  });

  describe(`Given a user with role ${Role.ADJOINT_SECRETAIRE_GENERAL}`, () => {
    let member: {
      email: string;
      firstName: string;
      lastName: string;
      role: Role;
      password: string;
    };

    beforeEach(async () => {
      const registerUser = app.get(RegisterUserUseCase);

      const adjoint = {
        role: Role.ADJOINT_SECRETAIRE_GENERAL,
        email: faker.internet.email(),
        password: randomUUID(),
      };
      member = {
        role: Role.MEMBRE_COMMUN,
        email: faker.internet.email(),
        password: randomUUID(),
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
      };

      await db.transaction(async (tx) => {
        await registerUser.execute({
          email: adjoint.email,
          password: adjoint.password,
          role: adjoint.role,
          firstName: faker.person.firstName(),
          lastName: faker.person.lastName(),
          gender: faker.person.sex() === 'female' ? Gender.F : Gender.M,
        })(tx);

        await registerUser.execute({
          email: member.email,
          password: member.password,
          role: member.role,
          firstName: member.firstName,
          lastName: member.lastName,
          gender: Gender.M,
        })(tx);
      });

      const response = await http
        .post('/api/auth/login')
        .send(adjoint)
        .expect(HttpStatus.OK)
        .expect('set-cookie', /.+/);
      cookie = response.headers['set-cookie']!;
    });

    it('should update a member excluded jurisdictions', async () => {
      const { body: memberList } = await http
        .set({ cookie })
        .get(`/api/members/v1`)
        .query({ search: member.email })
        .expect(HttpStatus.OK);

      const firstMember = (
        memberList as { items: MemberListItemDto[] }
      ).items.find(
        (user) =>
          user.firstName.toLowerCase() === member.firstName.toLowerCase() &&
          user.lastName.toLowerCase() === member.lastName.toLowerCase(),
      );
      const memberId = assertIsDefined(firstMember?.id);

      const { body: detailedMemberBefore } = await http
        .set({ cookie })
        .get(`/api/members/v1/${memberId}`);

      expect(
        (detailedMemberBefore as DetailedMemberDto).excludedJurisdictions,
      ).toEqual([]);

      await http
        .set({ cookie })
        .put(`/api/members/v1/${memberId}/excluded-jurisdictions`)
        .send({ jurisdictionIds: ['TGI LYON'] })
        .expect(HttpStatus.OK);

      const { body: detailedMemberAfter } = await http
        .set({ cookie })
        .get(`/api/members/v1/${memberId}`);

      expect(
        (detailedMemberAfter as DetailedMemberDto).excludedJurisdictions,
      ).toEqual([expect.objectContaining({ id: 'TGI LYON' })]);
    });
  });

  describe(`Given a user with role ${Role.MEMBRE_COMMUN}`, () => {
    beforeEach(async () => {
      const registerUser = app.get(RegisterUserUseCase);
      const email = faker.internet.email();
      const password = randomUUID();

      await db.transaction((tx) =>
        registerUser.execute({
          email,
          password,
          role: Role.MEMBRE_COMMUN,
          firstName: faker.person.firstName(),
          lastName: faker.person.lastName(),
          gender: faker.person.sex() === 'female' ? Gender.F : Gender.M,
        })(tx),
      );

      const response = await http
        .post('/api/auth/login')
        .send({ email, password })
        .expect(HttpStatus.OK);
      cookie = response.headers['set-cookie']!;
    });

    it('should throw', async () => {
      await http
        .set({ cookie })
        .get(`/api/members/v1`)
        .expect(HttpStatus.FORBIDDEN);
    });
  });

  describe('Given an unauthenticated user', () => {
    it('should throw', async () => {
      await http.get(`/api/members/v1`).expect(HttpStatus.UNAUTHORIZED);
    });
  });
});
