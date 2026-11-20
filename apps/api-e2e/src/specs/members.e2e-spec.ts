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

    test('details a member with the count of their reports', async ({ agent, expect, sessions }) => {
      await sessions.createOne(
        {
          candidates: [
            {
              firstName: 'ETIENNE',
              lastName: 'TREVOUX',
              position: { function: seed.functions.PR, grade: 'G3', jurisdiction: seed.jurisdictions['CA  LYON'] },
              targetPosition: {
                function: seed.functions.PR,
                grade: 'G3',
                jurisdiction: seed.jurisdictions['CA  GRENOBLE'],
              },
            },
          ],
          createdAt: '22/04/2026',
          name: `Rapports (${randomUUID()})`,
        },
        { reporters: [{ id: memberId }] },
      );

      const { data } = await agent.members.detailsMember({ path: { userId: memberId }, throwOnError: true });

      expect(data.stats).toEqual([{ count: 1, targetedGrade: 'G3', year: expect.any(Number) }]);
    });

    test('lists members with their formation and excluded jurisdictions', async ({ agent, expect }) => {
      await agent.members.excludeJurisdictions({ path: { userId: memberId }, body: { jurisdictionIds } });

      const members = await agent.members.listMembers({
        query: { formations: [], search: memberLastName },
      });
      expect(members.response?.status).toBe(200);

      const member = members.data?.items.find(({ id }) => id === memberId);
      expect(member?.excludedJurisdictions).toEqual([expect.objectContaining({ id: expect.stringMatching(/LYON/i) })]);
      expect(member?.formation).toEqual({ id: 'COMMUN', label: 'Commun' });
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
      const file = { nominationFileId: session.files[0]!.id, sessionId: session.id };
      const path = { ...file, userId: member['@user']!.id };

      await member.members.writeNominationFileMemberMemo({ body: { memo: 'À relire' }, path, throwOnError: true });
      const written = await member.sessions.detailNominationFile({ path: file });
      expect(written.data!.memo).toEqual({ value: 'À relire', visibility: 'VISIBLE' });

      await member.members.writeNominationFileMemberMemo({ body: { memo: '' }, path, throwOnError: true });
      const erased = await member.sessions.detailNominationFile({ path: file });
      expect(erased.data!.memo).toEqual({ value: null, visibility: 'VISIBLE' });
    });

    test('keeps their notes private from the admin impersonating them', async ({
      expect,
      impersonate,
      logIn,
      sessions,
    }) => {
      const session = await sessions.createOne({
        candidates: [
          {
            firstName: 'ETIENNE',
            lastName: 'TREVOUX',
            position: {
              function: seed.functions.PR,
              grade: 'G3',
              jurisdiction: seed.jurisdictions['CA  LYON'],
            },
            targetPosition: {
              function: seed.functions.PR,
              grade: 'G3',
              jurisdiction: seed.jurisdictions['CA  GRENOBLE'],
            },
          },
        ],
        createdAt: '22/04/2026',
        name: `Notes (${randomUUID()})`,
      });
      const member = await logIn('MEMBRE_COMMUN');
      const file = { nominationFileId: session.files[0]!.id, sessionId: session.id };
      const path = { ...file, userId: member['@user']!.id };
      await member.members.writeNominationFileMemberMemo({ body: { memo: 'À relire' }, path, throwOnError: true });

      const impersonator = await impersonate(member['@user']!);

      const read = await impersonator.sessions.detailNominationFile({ path: file });
      expect(read.data!.memo).toEqual({ visibility: 'PRIVATE' });
      const refused = await impersonator.members.writeNominationFileMemberMemo({ body: { memo: '' }, path });
      expect(refused.response?.status).toBe(403);
      const kept = await member.sessions.detailNominationFile({ path: file });
      expect(kept.data!.memo).toEqual({ value: 'À relire', visibility: 'VISIBLE' });
    });
  });

  test.describe('Given a user with role MEMBRE_DU_SIEGE', () => {
    test('cannot find a file of a PARQUET session to write their notes on', async ({ logIn, sessions, expect }) => {
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
      const member = await logIn('MEMBRE_DU_SIEGE');
      const path = { nominationFileId: session.files[0]!.id, sessionId: session.id, userId: member['@user']!.id };

      const refused = await member.members.writeNominationFileMemberMemo({ body: { memo: 'À relire' }, path });
      expect(refused.response?.status).toBe(404);
    });
  });
});
