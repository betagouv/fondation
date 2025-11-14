import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { agent } from 'supertest';
import { RootModule } from '../root.module';
import { SimpleAuthService } from './simple-auth.service';
import { faker } from '@faker-js/faker';
import { Gender, Role } from 'shared-models';
import { PG_POOL_TOKEN } from '../framework/database/database.constants';
import { Pool } from 'pg';
import { MainAppConfigurator } from 'src/main.configurator';

describe('Simple Auth E2E', () => {
  let app: INestApplication;
  let http: ReturnType<typeof agent>;
  let cookie: string;
  let user: { id: string; email: string; password: string };

  beforeAll(async () => {
    const container = await Test.createTestingModule({
      imports: [RootModule],
    }).compile();

    app = new MainAppConfigurator(container.createNestApplication())
      .withCookies('secret')
      .configure();

    await app.init();

    http = agent(app.getHttpServer());
  });

  afterAll(async () => {
    await app.get<Pool>(PG_POOL_TOKEN).end();
  });

  beforeEach(async () => {
    const auth = app.get(SimpleAuthService);

    const email = faker.internet.email();
    const password = faker.string.alphanumeric({
      length: faker.number.int({ min: 20, max: 40 }),
    });

    const { id } = await auth.registerUser({
      email,
      password,
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      gender: Gender.M,
      role: Role.MEMBRE_COMMUN,
    });

    user = { id, email, password };
  });

  describe('Given an existing user', () => {
    it('should login', async () => {
      const response = await http
        .post(`/api/auth/v2/login`)
        .send(user)
        .expect(HttpStatus.NO_CONTENT);

      cookie = response.header['set-cookie']!;

      await http
        .get(`/api/auth/v2/introspect`)
        .set({ cookie })
        .expect(HttpStatus.OK);
    });
  });

  describe('Given a logged-in user', () => {
    beforeEach(async () => {
      const response = await http.post(`/api/auth/v2/login`).send(user);
      cookie = response.headers['set-cookie']!;
    });

    it('should logout', async () => {
      const response = await http
        .set({ cookie })
        .post(`/api/auth/v2/logout`)
        .expect(HttpStatus.OK);

      const [setCookie] = ([] as (string | undefined)[]).concat(
        response.headers['set-cookie'],
      );
      expect(setCookie).toMatch(/Expires=Thu, 01 Jan 1970 00:00:00/);
    });
  });
});
