import * as crypto from 'node:crypto';

import type { LolfiData } from 'lolfi';
import { Magistrat } from 'shared-models';

import { test } from '../fixtures.ts';
import * as seed from '../utils/seed.ts';

test.describe('lolfi', () => {
  test('should import a session from lolfi', async ({ sessions, expect }) => {
    const session = await sessions.createOne({
      name: 'Transparence annuelle',
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

    expect(session).toEqual({ id: expect.any(String) });
  });

  test('should define a PROFILE priority', async ({ sessions, agent, expect }) => {
    const session = await sessions.createOne({
      name: `Transparence annuelle (${crypto.randomUUID()})`,
      createdAt: '22/04/2026',
      candidates: [
        {
          id: crypto.randomInt(1_000, 9_999),
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
            profile: 'profil assise',
            profileId: null,
            function: seed.functions.PR,
          },
        },
      ],
    });

    const sessionFiles = await agent.sessions.listNominationFiles({
      path: { sessionId: session.id },
    });
    expect(sessionFiles.data!.items[0]!.priorities).toEqual(['PROFILE']);
  });

  test('should update an existing session', async ({ sessions, agent, expect }) => {
    const initialSession: LolfiData['sessions'][number] = {
      id: crypto.randomInt(1_000, 900_000),
      name: crypto.randomUUID(),
      createdAt: '22/04/2026',
      candidates: [
        {
          id: crypto.randomInt(1_000, 9_999),
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
    };

    const nextSession: LolfiData['sessions'][number] = {
      id: crypto.randomInt(1_000, 900_000),
      name: crypto.randomUUID(),
      createdAt: '23/04/2026',
      candidates: [
        {
          firstName: 'MICHEL',
          lastName: 'BERGER',
          position: {
            function: seed.functions.P,
            jurisdiction: seed.jurisdictions['CA  LYON'],
          },
          targetPosition: {
            function: seed.functions.P,
            jurisdiction: seed.jurisdictions['TPR  CANNES'],
          },
        },
      ],
    };

    const initial = await sessions.createOne(initialSession);

    // Re-ingesting the same session alongside a new one must update it, not duplicate it
    const [, next] = await sessions.createMany([initialSession, nextSession]);

    const initialFiles = await agent.sessions.listNominationFiles({
      path: { sessionId: initial.id },
    });
    expect(initialFiles.data!.totalCount).toBe(1);

    const nextFiles = await agent.sessions.listNominationFiles({ path: { sessionId: next!.id } });
    expect(nextFiles.data!.totalCount).toBe(1);
  });
});
