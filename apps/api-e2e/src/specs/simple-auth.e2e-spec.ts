import supertest from 'supertest';

import { registerUser } from '../fixtures/auth.fixture';

import { getBaseUrl } from '../fixtures';
const baseUrl = getBaseUrl();

describe('Simple Auth E2E', () => {
  const http = supertest(baseUrl);
  let cookie: string;
  let user: { id: string; email: string; password: string };

  beforeEach(async () => {
    user = await registerUser(baseUrl, 'MEMBRE_COMMUN');
  });

  describe('Given an existing user', () => {
    it('should login', async () => {
      const response = await http
        .post('/api/auth/v2/login')
        .send({ email: user.email, password: user.password })
        .expect(204);

      cookie = response.header['set-cookie']!;

      await http.get('/api/auth/v2/introspect').set({ cookie }).expect(200);
    });
  });

  describe('Given a logged-in user', () => {
    beforeEach(async () => {
      const response = await http
        .post('/api/auth/v2/login')
        .send({ email: user.email, password: user.password });
      cookie = response.headers['set-cookie']!;
    });

    it('should logout', async () => {
      const response = await http.set({ cookie }).post('/api/auth/v2/logout').expect(204);

      const [setCookie] = ([] as (string | undefined)[]).concat(response.headers['set-cookie']);
      expect(setCookie).toMatch(/Expires=Thu, 01 Jan 1970 00:00:00/);
    });
  });
});
