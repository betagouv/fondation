import { Injectable } from '@nestjs/common';

import { Magistrat } from 'shared-models';

import { PrismaService } from 'src/modules/framework/database';
import { prismaFormationEnumToFormationEnum } from 'src/modules/shared/mappers/formation.mapper';
import { isDefined } from 'src/utils/is-defined';

@Injectable()
export class SynchronisedLolfiSessionsFinder {
  constructor(private readonly prisma: PrismaService) {}

  // An archived session counts as synchronised: it was removed on purpose, not lost
  async find(lolfiSessionIds: readonly number[]): Promise<Map<number, Set<Magistrat.Formation>>> {
    const sessions = await this.prisma.session.findMany({
      where: { lolfiSessionId: { in: [...lolfiSessionIds] } },
      select: { lolfiSessionId: true, formation: true },
    });

    const perLolfiSession = new Map<number, Set<Magistrat.Formation>>();
    for (const { lolfiSessionId, formation } of sessions) {
      if (!isDefined(lolfiSessionId)) continue;

      const formations = perLolfiSession.get(lolfiSessionId) ?? new Set<Magistrat.Formation>();
      formations.add(prismaFormationEnumToFormationEnum(formation));
      perLolfiSession.set(lolfiSessionId, formations);
    }

    return perLolfiSession;
  }
}
