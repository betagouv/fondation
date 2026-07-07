import { randomUUID } from 'node:crypto';

import { Magistrat } from 'shared-models';

import { test } from '../fixtures.ts';
import * as seed from '../utils/seed.ts';

test.describe('Members E2E', () => {
  test.describe('Given a user with role ADJOINT_SECRETAIRE_GENERAL', () => {
    let memberId: string;
    let jurisdictionIds: string[];

    // Jurisdictions are populated by importing a LODAM session
    test.beforeEach(async ({ agent, sessions, registerUser, expect }) => {
      await sessions.createOne({
        name: `Setup (${randomUUID()})`,
        createdAt: '22/04/2026',
        candidates: [
          {
            firstName: 'ETIENNE',
            lastName: 'TREVOUX',
            position: {
              grade: Magistrat.Grade.G3,
              jurisdiction: seed.jurisdictions['CA  LYON'],
              function: seed.functions.PR,
            },
            targetPosition: {
              grade: Magistrat.Grade.G3,
              jurisdiction: seed.jurisdictions['CA  GRENOBLE'],
              function: seed.functions.PR,
            },
          },
        ],
      });

      const jurisdictions = await agent.jurisdictions.search({ query: { search: 'LYON' } });
      expect(jurisdictions.response?.status).toBe(200);
      jurisdictionIds = jurisdictions.data!.items.map((j) => j.id).slice(0, 1);

      const member = await registerUser('MEMBRE_COMMUN');
      memberId = member.id;
    });

    test('updates a member excluded jurisdictions', async ({ agent, expect }) => {
      const detailedMemberBefore = await agent.members.detailsMember({
        path: { userId: memberId },
      });
      expect(detailedMemberBefore.data?.excludedJurisdictions).toEqual([]);

      const updateRes = await agent.members.excludeJurisdictions({
        path: { userId: memberId },
        body: { jurisdictionIds },
      });
      expect(updateRes.response?.status).toBe(204);

      const detailedMemberAfter = await agent.members.detailsMember({ path: { userId: memberId } });
      expect(detailedMemberAfter.data?.excludedJurisdictions).toEqual([
        expect.objectContaining({ id: expect.stringMatching(/LYON/i) }),
      ]);
    });
  });
});
