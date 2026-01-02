import { faker } from '@faker-js/faker';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Gender, Role } from 'shared-models';
import { AppModule } from 'src/app.module';
import { agent } from 'supertest';
import { SimpleAuthService } from './simple-auth.service';

describe('Simple Auth E2E', () => {
  let app: INestApplication;
  let http: ReturnType<typeof agent>;
  let cookie: string;
  let user: { id: string; email: string; password: string };

  beforeAll(async () => {
    app = await AppModule.create();
    await app.init();

    http = agent(app.getHttpServer());
  });

  afterAll(async () => {
    await app.close();
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
        .expect(HttpStatus.NO_CONTENT);

      const [setCookie] = ([] as (string | undefined)[]).concat(
        response.headers['set-cookie'],
      );
      expect(setCookie).toMatch(/Expires=Thu, 01 Jan 1970 00:00:00/);
    });
  });
});
