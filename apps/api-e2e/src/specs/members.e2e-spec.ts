import { randomUUID } from 'node:crypto';

import { test } from '../fixtures.ts';
import * as seed from '../utils/seed.ts';

test.describe('Members E2E', () => {
  test.describe('Given a user with role ADJOINT_SECRETAIRE_GENERAL', () => {
    let memberId: string;
    let memberLastName: string;
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
              grade: 'G3',
              jurisdiction: seed.jurisdictions['CA  LYON'],
              function: seed.functions.PR,
            },
            targetPosition: {
              grade: 'G3',
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
      memberLastName = member.lastName;
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

    test('lists members with their excluded jurisdictions', async ({ agent, expect }) => {
      await agent.members.excludeJurisdictions({ path: { userId: memberId }, body: { jurisdictionIds } });

      const members = await agent.members.listMembers({
        query: { formations: [], search: memberLastName },
      });
      expect(members.response?.status).toBe(200);

      const member = members.data?.items.find(({ id }) => id === memberId);
      expect(member?.excludedJurisdictions).toEqual([expect.objectContaining({ id: expect.stringMatching(/LYON/i) })]);
    });
  });

  test.describe('Given a user with role MEMBRE_COMMUN', () => {
    test('writes, reads back then erases their notes on a file', async ({ logIn, sessions, expect }) => {
      const session = await sessions.createOne({
        name: `Notes (${randomUUID()})`,
        createdAt: '22/04/2026',
        candidates: [
          {
            firstName: 'ETIENNE',
            lastName: 'TREVOUX',
            position: {
              grade: 'G3',
              jurisdiction: seed.jurisdictions['CA  LYON'],
              function: seed.functions.PR,
            },
            targetPosition: {
              grade: 'G3',
              jurisdiction: seed.jurisdictions['CA  GRENOBLE'],
              function: seed.functions.PR,
            },
          },
        ],
      });
      const member = await logIn('MEMBRE_COMMUN');
      const { data: files } = await member.sessions.listNominationFiles({ path: { sessionId: session.id } });
      const file = { nominationFileId: files!.items[0]!.id, sessionId: session.id };
      const path = { ...file, userId: member['@user']!.id };

      await member.members.writeNominationFileMemberMemo({ body: { memo: 'À relire' }, path, throwOnError: true });
      const written = await member.sessions.detailNominationFile({ path: file });
      expect(written.data!.memo).toEqual({ value: 'À relire' });

      await member.members.writeNominationFileMemberMemo({ body: { memo: '' }, path, throwOnError: true });
      const erased = await member.sessions.detailNominationFile({ path: file });
      expect(erased.data!.memo).toEqual({ value: null });
    });
  });
});
