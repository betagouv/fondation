import * as assert from 'node:assert';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

import { describe, beforeAll, test } from '../fixtures';
import type { AffectReportersDto, DetailedReportDto, ListedMemberSessionsDto } from '../generated/api/types';

const LODAM_FILE_PATH = path.join(__dirname, '../../assets/lodam/lodam_transparence.xlsx');

describe('Session Affectations E2E', () => {
  let user: { id: string; cookie: string };
  let member: { id: string; email: string; password: string; cookie: string | undefined };

  describe('Given an existing session', () => {
    let sessionId: string;

    beforeAll(async ({ registerUser }) => {
      // Register members that exist in the LODAM file (ANDOCHE, DURAND)
      await registerUser(baseUrl, 'MEMBRE_COMMUN');
      await registerUser(baseUrl, 'MEMBRE_DU_PARQUET');

      const partialMember = await registerUser(baseUrl, 'MEMBRE_DU_PARQUET');
      member = { ...partialMember, cookie: undefined };

      const admin = await registerUser(baseUrl, 'ADJOINT_SECRETAIRE_GENERAL');

      const loginRes = await http.post('/api/auth/v2/login').auth(admin.email, admin.password).expect(204);
      user = { id: admin.id, cookie: loginRes.headers['set-cookie']! };

      const fileBuffer = await fs.readFile(LODAM_FILE_PATH);
      const importRes = await http
        .post('/api/sessions/v2/lodam')
        .set({ cookie: user.cookie })
        .attach('file', fileBuffer, {
          filename: 'transparence.xlsx',
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
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
          { filename: 'form.json', contentType: 'application/json' },
        )
        .expect(201);

      sessionId = importRes.body.id;
    });

    test("when available, then the session should not appear in the members' list before publishing", async ({
      member,
    }) => {
      member['@'];
      const listMemberSessionsRes = await member.members.list;

      await http
        .get(`/api/members/v1/${member.id}/sessions/transparence/garde-des-sceaux`)
        .set({ cookie: member.cookie })
        .expect(200);

      expect((listMemberSessionsRes.body as ListedMemberSessionsDto).items).not.toContainEqual({
        id: sessionId,
      });
    });

    describe('when the admin publish the session with an affectation', () => {
      beforeAll(async () => {
        const sessionRes = await http
          .get(`/api/sessions/v2/${sessionId}/files`)
          .set({ cookie: user.cookie })
          .expect(200);

        const firstFileId: string = sessionRes.body.items[0]!.id;
        await http
          .post(`/api/sessions/v2/${sessionId}/files/reporters`)
          .set({ cookie: user.cookie })
          .send({
            items: [{ nominationFileId: firstFileId, reporterIds: [member.id], priorities: [] }],
          } satisfies AffectReportersDto)
          .expect(204);

        await http
          .post(`/api/sessions/v2/${sessionId}/files/reporters/versions`)
          .set({ cookie: user.cookie })
          .expect(204);

        const loginRes = await http
          .post('/api/auth/v2/login')
          .auth(member.email, member.password)
          .expect(204);
        member.cookie = loginRes.headers['set-cookie']!;
      });

      test("then the session should be visible inside the members' list", async () => {
        const listMemberSessionsRes = await http
          .get(`/api/members/v1/${member.id}/sessions/transparence/garde-des-sceaux`)
          .set({ cookie: member.cookie })
          .expect(200);

        expect((listMemberSessionsRes.body as ListedMemberSessionsDto).items).toContainEqual(
          expect.objectContaining({ id: sessionId, isAffected: true }),
        );
      });

      test('then the report should be editable', async () => {
        const listMemberSessionsRes = await http
          .get(`/api/members/v1/${member.id}/sessions/transparence/garde-des-sceaux`)
          .set({ cookie: member.cookie })
          .expect(200);
        const firstAffected = (listMemberSessionsRes.body as ListedMemberSessionsDto).items.find(
          (x) => x.isAffected,
        );
        expect(firstAffected).toBeDefined();
        assert.ok(firstAffected);

        const detailedSession = await http
          .get(`/api/members/v1/${member.id}/sessions/transparence/garde-des-sceaux/${firstAffected.id}`)
          .set({ cookie: member.cookie })
          .expect(200);

        const firstReport = detailedSession.body.items[0];
        expect(firstReport).toBeDefined();
        assert.ok(firstReport);

        await http
          .patch(`/api/reports/v2/${firstReport.id}`)
          .send({ status: 'IN_PROGRESS' })
          .set({ cookie: member.cookie })
          .expect(204);
      });

      describe('and then removes the affectation', () => {
        beforeAll(async () => {
          const sessionRes = await http
            .get(`/api/sessions/v2/${sessionId}/files`)
            .set({ cookie: user.cookie })
            .expect(200);

          const firstFileId: string = sessionRes.body.items[0]!.id;
          await http
            .post(`/api/sessions/v2/${sessionId}/files/reporters`)
            .set({ cookie: user.cookie })
            .send({
              items: [{ nominationFileId: firstFileId, reporterIds: [], priorities: [] }],
            } satisfies AffectReportersDto)
            .expect(204);

          await http
            .set({ cookie: user.cookie })
            .post(`/api/sessions/v2/${sessionId}/files/reporters/versions`)
            .expect(204);
        });

        test(`then the session should not be visible as affected in the members' list`, async () => {
          const loginRes = await http
            .post('/api/auth/v2/login')
            .auth(member.email, member.password)
            .expect(204);
          member.cookie = loginRes.headers['set-cookie']!;

          const listMemberSessionsRes = await http
            .get(`/api/members/v1/${member.id}/sessions/transparence/garde-des-sceaux`)
            .set({ cookie: member.cookie })
            .expect(200);

          expect((listMemberSessionsRes.body as ListedMemberSessionsDto).items).toContainEqual(
            expect.objectContaining({ id: sessionId, isAffected: false }),
          );
        });

        describe('and reset affectation', () => {
          beforeAll(async () => {
            const sessionRes = await http
              .get(`/api/sessions/v2/${sessionId}/files`)
              .set({ cookie: user.cookie })
              .expect(200);

            const firstFileId: string = sessionRes.body.items[0]!.id;
            await http
              .post(`/api/sessions/v2/${sessionId}/files/reporters`)
              .set({ cookie: user.cookie })
              .send({
                items: [{ nominationFileId: firstFileId, reporterIds: [member.id], priorities: [] }],
              } satisfies AffectReportersDto)
              .expect(204);

            await http
              .set({ cookie: user.cookie })
              .post(`/api/sessions/v2/${sessionId}/files/reporters/versions`)
              .expect(204);
          });

          test('then the report should keep the previous editions', async () => {
            const listMemberSessionsRes = await http
              .get(`/api/members/v1/${member.id}/sessions/transparence/garde-des-sceaux`)
              .set({ cookie: member.cookie })
              .expect(200);
            const firstAffected = (listMemberSessionsRes.body as ListedMemberSessionsDto).items.find(
              (x) => x.isAffected,
            );
            expect(firstAffected).toBeDefined();
            assert.ok(firstAffected);

            const detailedSession = await http
              .get(`/api/members/v1/${member.id}/sessions/transparence/garde-des-sceaux/${firstAffected.id}`)
              .set({ cookie: member.cookie })
              .expect(200);

            const firstReport = detailedSession.body.items[0];
            expect(firstReport).toBeDefined();
            assert.ok(firstReport);

            const reportRes = await http
              .get(`/api/reports/v2/${firstReport.id}`)
              .set({ cookie: member.cookie })
              .expect(200);

            expect((reportRes.body as DetailedReportDto).state).toBe('IN_PROGRESS');
          });
        });
      });
    });
  });
});
