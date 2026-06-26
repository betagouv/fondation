import * as crypto from 'node:crypto';

import { generateLolfiArchive, type LolfiData } from 'lolfi';
import supertest from 'supertest';

import { Magistrat } from 'shared-models';

import { registerUser } from '../fixtures/auth.fixture';
import { createSession } from '../fixtures/session.fixture';

import { getBaseUrl } from '../fixtures';
const baseUrl = getBaseUrl();

describe('lolfi', () => {
  const http = supertest(baseUrl);
  let user: { id: string; cookie: string; email: string; password: string };

  beforeAll(async () => {
    const registered = await registerUser(baseUrl, 'ADMIN');
    const authResponse = await http
      .post('/api/auth/v2/login')
      .send({ email: registered.email, password: registered.password })
      .expect(204);

    user = {
      ...registered,
      cookie: authResponse.headers['set-cookie']!,
    };
  });

  it('should import a session from lolfi', async () => {
    const session = await createSession({
      baseUrl,
      cookie: user.cookie,
      session: {
        name: 'Transparence annuelle',
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
                labelOneMale: 'procureur de la République',
                formation: Magistrat.Formation.PARQUET,
              },
            },
            targetPosition: {
              grade: Magistrat.Grade.G3,
              jurisdiction: { id: 'CA  GRENOBLE' },
              function: {
                id: 'PR',
                label: 'Procureur de la République',
                labelOneMale: 'procureur de la République',
                formation: Magistrat.Formation.PARQUET,
              },
            },
          },
        ],
      },
    });

    expect(session).toEqual({ id: expect.any(String) });
  });

  it('should define a PROFILE priority', async () => {
    const session = await createSession({
      baseUrl,
      cookie: user.cookie,
      session: {
        name: `Transparence annuelle (${crypto.randomUUID()})`,
        createdAt: '22/04/2026',
        candidates: [
          {
            id: crypto.randomInt(1_000, 9_999),
            firstName: 'ETIENNE',
            lastName: 'TREVOUX',
            position: {
              grade: Magistrat.Grade.G3,
              jurisdiction: { id: 'CA  LYON' },
              function: {
                id: 'PR',
                label: 'Procureur de la République',
                labelOneMale: 'procureur de la République',
                formation: Magistrat.Formation.PARQUET,
              },
            },
            targetPosition: {
              grade: Magistrat.Grade.G3,
              jurisdiction: { id: 'CA  GRENOBLE' },
              profile: 'profil assise',
              profileId: null,
              function: {
                id: 'PR',
                label: 'Procureur de la République',
                labelOneMale: 'procureur de la République',
                formation: Magistrat.Formation.PARQUET,
              },
            },
          },
        ],
      },
    });

    const { body: sessionFiles } = await http
      .set({ cookie: user.cookie })
      .get(`/api/sessions/v2/${session.id}/files`);

    expect(sessionFiles.items[0].priorities).toEqual(['PROFILE']);
  });

  it('should update an existing session', async () => {
    const lolfiSession = { name: crypto.randomUUID(), id: crypto.randomInt(1_000, 900_000) };
    const initialSession: LolfiData['sessions'][number] = {
      id: lolfiSession.id,
      name: lolfiSession.name,
      createdAt: '22/04/2026',
      candidates: [
        {
          id: crypto.randomInt(1_000, 9_999),
          firstName: 'ETIENNE',
          lastName: 'TREVOUX',
          position: {
            grade: Magistrat.Grade.G3,
            jurisdiction: { id: 'CA  LYON' },
            function: {
              id: 'PR',
              label: 'Procureur de la République',
              labelOneMale: 'procureur de la République',
              formation: Magistrat.Formation.PARQUET,
            },
          },
          targetPosition: {
            grade: Magistrat.Grade.G3,
            jurisdiction: { id: 'CA  GRENOBLE' },
            function: {
              id: 'PR',
              label: 'Procureur de la République',
              labelOneMale: 'procureur de la République',
              formation: Magistrat.Formation.PARQUET,
            },
          },
        },
      ],
    };

    const session = await createSession({ baseUrl, cookie: user.cookie, session: initialSession });

    const nextSession = { id: crypto.randomInt(1_000, 900_000), name: crypto.randomUUID() };
    const archive = await generateLolfiArchive({
      sessions: [
        initialSession,
        {
          id: nextSession.id,
          name: nextSession.name,
          createdAt: '23/04/2026',
          candidates: [
            {
              firstName: 'MICHEL',
              lastName: 'BERGER',
              position: {
                function: { id: 'P', formation: 'SIEGE', label: 'président' },
                jurisdiction: { id: 'TJ  LYON' },
              },
              targetPosition: {
                function: { id: 'P', formation: 'SIEGE', label: 'président' },
                jurisdiction: { id: 'TJ  CANNES' },
              },
            },
          ],
        },
      ],
    });

    const { body: ingestionBody } = await http
      .post('/api/ingest/v1/lolfi')
      .set({ cookie: user.cookie })
      .attach('file', archive, {
        filename: `LOLFI_CSM_${new Date().toISOString()}.zip`,
        contentType: 'application/zip',
      })
      .expect(200);
    const jobId: number = ingestionBody.id;

    let nextSessionId!: string;
    await expect
      .poll(async () => {
        const { body: job } = await http
          .get(`/api/jobs/v1/${jobId}`)
          .set({ cookie: user.cookie })
          .expect(200);
        expect(job.status).toBe('SUCCEEDED');

        const { body: sessions } = await http
          .get('/api/sessions/v2/garde-des-sceaux')
          .set({ cookie: user.cookie })
          .query({ search: `${nextSession.name} (${nextSession.id})` })
          .expect(200);
        expect(sessions.items[0]).toBeDefined();

        nextSessionId = sessions.items[0].id;
        return nextSessionId;
      })
      .toBeDefined();

    const sessionResponse = await http
      .set({ cookie: user.cookie })
      .get(`/api/sessions/v2/${session.id}/files`)
      .expect(200);
    expect(sessionResponse.body.totalCount).toBe(1);

    const nextSessionResponse = await http
      .set({ cookie: user.cookie })
      .get(`/api/sessions/v2/${nextSessionId}/files`)
      .expect(200);
    expect(nextSessionResponse.body.totalCount).toBe(1);
  });
});
