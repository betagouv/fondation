import { randomUUID } from 'node:crypto';

import { Magistrat } from 'shared-models';

import type { DetailedMemberDto, ListedJurisdictions } from '../generated/api/types';

describe('Members E2E', () => {
  // Jurisdictions are populated via LODAM session import
  let jurisdictionIds: string[] = [];

  beforeAll(async () => {
    const admin = await registerUser(baseUrl, 'ADJOINT_SECRETAIRE_GENERAL');
    const loginRes = await http
      .post('/api/auth/v2/login')
      .send({ email: admin.email, password: admin.password })
      .expect(204)
      .expect('set-cookie', /.+/);
    cookie = loginRes.headers['set-cookie']!;

    // Import a LODAM session to populate jurisdictions in the database
    await createSession({
      baseUrl,
      cookie,
      session: {
        name: `Setup (${randomUUID()})`,
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
                formation: Magistrat.Formation.PARQUET,
              },
            },
            targetPosition: {
              grade: Magistrat.Grade.G3,
              jurisdiction: { id: 'CA  GRENOBLE' },
              function: {
                id: 'PR',
                label: 'Procureur de la République',
                formation: Magistrat.Formation.PARQUET,
              },
            },
          },
        ],
      },
    });

    const { body: found } = await http
      .get('/api/jurisdictions/v1')
      .set({ cookie })
      .query({ search: 'LYON' })
      .expect(200);
    jurisdictionIds = (found as ListedJurisdictions).items.map((j) => j.id).slice(0, 1);
  });

  describe(`Given a user with role ADJOINT_SECRETAIRE_GENERAL`, () => {
    let memberId: string;

    beforeEach(async () => {
      const memberCredentials = await registerUser(baseUrl, 'MEMBRE_COMMUN');
      memberId = memberCredentials.id;
    });

    it('should update a member excluded jurisdictions', async () => {
      const { body: detailedMemberBefore } = await http.set({ cookie }).get(`/api/members/v1/${memberId}`);

      expect((detailedMemberBefore as DetailedMemberDto).excludedJurisdictions).toEqual([]);

      await http
        .set({ cookie })
        .put(`/api/members/v1/${memberId}/excluded-jurisdictions`)
        .send({ jurisdictionIds })
        .expect(204);

      const { body: detailedMemberAfter } = await http.set({ cookie }).get(`/api/members/v1/${memberId}`);

      expect((detailedMemberAfter as DetailedMemberDto).excludedJurisdictions).toEqual([
        expect.objectContaining({ id: expect.stringMatching(/LYON/i) }),
      ]);
    });
  });

  describe(`Given a user with role MEMBRE_COMMUN`, () => {
    let memberCookie: string;

    beforeEach(async () => {
      const member = await registerUser(baseUrl, 'MEMBRE_COMMUN');
      const res = await http
        .post('/api/auth/v2/login')
        .send({ email: member.email, password: member.password })
        .expect(204);
      memberCookie = res.headers['set-cookie']!;
    });

    it('should throw', async () => {
      await http.set({ cookie: memberCookie }).get('/api/members/v1').expect(403);
    });
  });

  describe('Given an unauthenticated user', () => {
    it('should throw', async () => {
      await http.get('/api/members/v1').expect(401);
    });
  });
});
