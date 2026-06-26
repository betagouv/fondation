import supertest from 'supertest';

import { Magistrat } from 'shared-models';

import { registerUser } from '../fixtures/auth.fixture';
import { createSession } from '../fixtures/session.fixture';
import type { FoundDocsNominationFiles } from '../generated/api/types';

import { getBaseUrl } from '../fixtures';
const baseUrl = getBaseUrl();

describe('Docs Service', () => {
  const http = supertest(baseUrl);

  let chairman: { id: string };
  let session: { id: string };
  let user: { email: string; password: string; id: string; cookie: string };

  beforeAll(async () => {
    const chairmanCredentials = await registerUser(baseUrl, 'MEMBRE_DU_PARQUET');
    const adminCredentials = await registerUser(baseUrl, 'ADMIN');

    const adminLogin = await http
      .post('/api/auth/v2/login')
      .send({ email: adminCredentials.email, password: adminCredentials.password })
      .expect(204);
    user = { ...adminCredentials, cookie: adminLogin.headers['set-cookie']! };

    // Promote chairman to PRESIDENT_PARQUET via the administration endpoint
    await http
      .put(`/api/administration/v1/users/${chairmanCredentials.id}/role`)
      .set({ cookie: user.cookie })
      .send({ role: 'PRESIDENT_PARQUET' })
      .expect(204);
    chairman = { id: chairmanCredentials.id };

    session = await createSession({
      baseUrl,
      cookie: user.cookie,
      session: {
        createdAt: '23/04/2026',
        candidates: [
          {
            firstName: 'ANTONIO',
            lastName: 'GRAMSCI',
            civilite: 'M.',
            position: {
              function: { id: 'PR', label: 'Procureur de la République', formation: Magistrat.Formation.PARQUET },
              jurisdiction: { id: 'CA  AMIENS' },
              grade: Magistrat.Grade.G3,
            },
            targetPosition: {
              function: { id: 'PR', label: 'Procureur de la République', formation: Magistrat.Formation.PARQUET },
              jurisdiction: { id: 'CA  REIMS' },
              grade: Magistrat.Grade.G3,
            },
          },
          {
            firstName: 'HANNAH',
            lastName: 'ARENDT',
            civilite: 'MME',
            position: {
              function: { id: 'PR', label: 'Procureur de la République', formation: Magistrat.Formation.PARQUET },
              jurisdiction: { id: 'CA  GRENOBLE' },
              grade: Magistrat.Grade.G3,
            },
            targetPosition: {
              function: { id: 'PR', label: 'Procureur de la République', formation: Magistrat.Formation.PARQUET },
              jurisdiction: { id: 'CA  LYON' },
              grade: Magistrat.Grade.G3,
            },
          },
        ],
      },
    });

    await http.post(`/api/sessions/v2/${session.id}/validation`).set({ cookie: user.cookie }).expect(204);
    await http
      .post(`/api/sessions/v2/${session.id}/files/reporters/versions`)
      .set({ cookie: user.cookie })
      .expect(204);
  });

  beforeEach(async () => {
    const response = await http
      .post('/api/auth/v2/login')
      .send({ email: user.email, password: user.password })
      .expect(204);
    user.cookie = response.headers['set-cookie']!;
  });

  it('should prevent creating an agenda with twice the same file', async () => {
    const foundAgendaNominationFiles = await http
      .get(`/api/docs/v1/sessions/${session.id}/files`)
      .set({ cookie: user.cookie })
      .expect(200);

    const nominationFiles: FoundDocsNominationFiles = foundAgendaNominationFiles.body;
    expect(nominationFiles.items).toHaveLength(2);

    for (const { id } of nominationFiles.items) {
      await http
        .put(`/api/sessions/v2/${session.id}/files/${id}/outcome`)
        .set({ cookie: user.cookie })
        .send({ comment: null, outcome: 'VALIDATED' })
        .expect(204);
    }

    const agenda1 = await http
      .post(`/api/docs/v1/sessions/${session.id}/agendas`)
      .set({ cookie: user.cookie })
      .send({
        chairmanId: chairman.id,
        date: { day: 1, month: 2, year: 2026 },
        sessionMeetingDate: { day: 10, month: 2, year: 2026 },
        nominationFileIds: [nominationFiles.items[0]!.id],
      })
      .expect(201);

    expect(agenda1.body).toEqual({ id: expect.any(String) });

    const foundAfter = await http
      .get(`/api/docs/v1/sessions/${session.id}/files`)
      .set({ cookie: user.cookie })
      .expect(200);
    expect((foundAfter.body as FoundDocsNominationFiles).items).toHaveLength(1);

    await http
      .post(`/api/docs/v1/sessions/${session.id}/agendas`)
      .set({ cookie: user.cookie })
      .send({
        chairmanId: chairman.id,
        date: { day: 2, month: 2, year: 2026 },
        sessionMeetingDate: { day: 11, month: 2, year: 2026 },
        nominationFileIds: [nominationFiles.items[0]!.id],
      })
      .expect(400);
  });
});
