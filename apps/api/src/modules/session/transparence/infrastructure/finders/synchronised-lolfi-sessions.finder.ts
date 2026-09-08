import { Injectable } from '@nestjs/common';

import { Db } from 'src/modules/framework/database';
import { FormationEnum } from 'src/modules/shared/formation.enum';
import { prismaFormationEnumToFormationEnum } from 'src/modules/shared/mappers/formation.mapper';
import { isDefined } from 'src/utils/is-defined';

@Injectable()
export class SynchronisedLolfiSessionsFinder {
  constructor(private readonly db: Db) {}

  // An archived session counts as synchronised: it was removed on purpose, not lost
  async find(lolfiSessionIds: readonly number[]): Promise<Map<number, Set<FormationEnum>>> {
    const sessions = await this.db.tx.sessionTransparenceGds.findMany({
      where: { lolfiSessionId: { in: [...lolfiSessionIds] } },
      select: { lolfiSessionId: true, session: { select: { formation: true } } },
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
