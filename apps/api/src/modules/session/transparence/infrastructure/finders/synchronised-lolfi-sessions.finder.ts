import { Injectable } from '@nestjs/common';

import { Prisma } from '../../../../../generated/prisma/client';
import { isDefined } from '../../../../../utils/is-defined';
import { Db } from '../../../../framework/database';
import { FormationEnum } from '../../../../shared/formation.enum';
import { prismaFormationEnumToFormationEnum } from '../../../../shared/mappers/formation.mapper';

@Injectable()
export class SynchronisedLolfiSessionsFinder {
  constructor(private readonly db: Db) {}

  // An archived session counts as synchronised: it was removed on purpose, not lost
  async find(lolfiSessionIds: readonly number[]): Promise<Map<number, Set<FormationEnum>>> {
    const sessions = await this.db.tx.sessionTransparenceGds.findMany({
      where: { lolfiSessionId: { in: [...lolfiSessionIds] } },
      select: {
        lolfiSessionId: true,
        session: { select: { formation: true } },
      } satisfies Prisma.SessionTransparenceGdsSelect,
    });

    const perLolfiSession = new Map<number, Set<FormationEnum>>();
    for (const { lolfiSessionId, session } of sessions) {
      if (!isDefined(lolfiSessionId)) continue;

      const formations = perLolfiSession.get(lolfiSessionId) ?? new Set<FormationEnum>();
      formations.add(prismaFormationEnumToFormationEnum(session.formation));
      perLolfiSession.set(lolfiSessionId, formations);
    }

    return perLolfiSession;
  }
}
