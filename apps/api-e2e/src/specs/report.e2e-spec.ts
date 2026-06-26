import { randomUUID } from 'node:crypto';

import supertest from 'supertest';

import { Magistrat, ReportFileUsage } from 'shared-models';

import { registerUser } from '../fixtures/auth.fixture';
import { createSession } from '../fixtures/session.fixture';
import type { DetailedReportDto } from '../generated/api/types';

import { getBaseUrl } from '../fixtures';
const baseUrl = getBaseUrl();

describe('Report E2E', () => {
  const http = supertest(baseUrl);
  let cookie: string;
  let reportId: string;

  beforeAll(async () => {
    const admin = await registerUser(baseUrl, 'ADMIN');
    const member = await registerUser(baseUrl, 'MEMBRE_COMMUN');

    const adminLogin = await http
      .post('/api/auth/v2/login')
      .send({ email: admin.email, password: admin.password })
      .expect(204);
    const adminCookie: string = adminLogin.headers['set-cookie']!;

    const memberLogin = await http
      .post('/api/auth/v2/login')
      .send({ email: member.email, password: member.password })
      .expect(204);
    cookie = memberLogin.headers['set-cookie']!;

    // Create a session and assign the member so a report is created automatically
    const session = await createSession({
      baseUrl,
      cookie: adminCookie,
      session: {
        name: 'Transparence rapport',
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

    const filesRes = await http
      .get(`/api/sessions/v2/${session.id}/files`)
      .set({ cookie: adminCookie })
      .expect(200);
    const nominationFileId: string = filesRes.body.items[0].id;

    // Assign member as reporter and publish
    await http
      .post(`/api/sessions/v2/${session.id}/files/reporters`)
      .set({ cookie: adminCookie })
      .send({ items: [{ nominationFileId, reporterIds: [member.id], priorities: [] }] })
      .expect(204);

    await http
      .post(`/api/sessions/v2/${session.id}/files/reporters/versions`)
      .set({ cookie: adminCookie })
      .expect(204);

    // Refresh member cookie and get report ID
    const memberLogin2 = await http
      .post('/api/auth/v2/login')
      .send({ email: member.email, password: member.password })
      .expect(204);
    cookie = memberLogin2.headers['set-cookie']!;

    const memberSessionRes = await http
      .get(`/api/members/v1/${member.id}/sessions/transparence/garde-des-sceaux/${session.id}`)
      .set({ cookie })
      .expect(200);
    reportId = memberSessionRes.body.items[0].id;
  });

  it('should attach files to a report', async () => {
    const filename = `image_${randomUUID()}.png`;

    await http
      .post(`/api/reports/v2/${reportId}/files`)
      .query({ usage: ReportFileUsage.ATTACHMENT })
      .attach('files', Buffer.alloc(8), { contentType: 'image/png', filename })
      .set('cookie', cookie)
      .expect(204);

    const res = await http.get(`/api/reports/v2/${reportId}`).set('cookie', cookie).expect(200);
    expect((res.body as DetailedReportDto).attachments.map((a) => a.name)).toContain(filename);
  });

  it('should detach files from a report', async () => {
    const id = randomUUID();
    const file1 = `image_1_${id}.png`;
    const file2 = `image_2_${id}.png`;

    await http
      .post(`/api/reports/v2/${reportId}/files`)
      .query({ usage: ReportFileUsage.ATTACHMENT })
      .attach('files', Buffer.alloc(8), { contentType: 'image/png', filename: file1 })
      .attach('files', Buffer.alloc(8), { contentType: 'image/png', filename: file2 })
      .set('cookie', cookie)
      .expect(204);

    await http
      .delete(`/api/reports/v2/${reportId}/files`)
      .query({ fileNames: file1 })
      .set('cookie', cookie)
      .expect(204);

    const after = await http.get(`/api/reports/v2/${reportId}`).set('cookie', cookie).expect(200);
    const names = (after.body as DetailedReportDto).attachments.map((a) => a.name);
    expect(names).not.toContain(file1);
    expect(names).toContain(file2);
  });
});
