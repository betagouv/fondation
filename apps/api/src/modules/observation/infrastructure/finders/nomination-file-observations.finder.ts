import { Injectable } from '@nestjs/common';
import { load } from 'cheerio';

import type { ObservationFollowUpEnum } from '../../domain/observation-follow-up';
import { Prisma } from 'src/generated/prisma/client';
import { Db } from 'src/modules/framework/database';
import { assertPgParams } from 'src/utils/assert-pg-params';

type Observant = { firstName: string; id: string; lastName: string; usedName: string | null };

export type NominationFileObservation = {
  dateReception: Date;
  description: string;
  followUp: ObservationFollowUpEnum | null;
  followUpComment: string | null;
  /** whether the member asking wrote a comment on it */
  hasUserComment: boolean;
  id: string;
  magistrat: Observant;
};

@Injectable()
export class NominationFileObservationsFinder {
  constructor(private readonly db: Db) {}

  async find(query: {
    nominationFileIds: ReadonlySet<string>;
    userId: string;
  }): Promise<Map<string, NominationFileObservation[]>> {
    assertPgParams(query.nominationFileIds);

    const observations = await this.db.tx.observation.findMany({
      orderBy: [{ dateReception: 'asc' }, { id: 'asc' }],
      select: {
        dateReception: true,
        description: true,
        followUp: true,
        followUpComment: true,
        id: true,
        magistrat: { select: { firstName: true, id: true, lastName: true, usedName: true } },
        memberComments: { select: { comment: true }, where: { userId: query.userId } },
        nominationFileId: true,
      } satisfies Prisma.ObservationSelect,
      where: { nominationFileId: { in: [...query.nominationFileIds] } },
    });

    const byNominationFileId = new Map<string, NominationFileObservation[]>();
    for (const { memberComments, nominationFileId, ...observation } of observations) {
      const list = byNominationFileId.get(nominationFileId) ?? [];
      list.push({
        ...observation,
        // a comment emptied in the editor still holds its html tags
        hasUserComment: memberComments.some(({ comment }) => !!load(comment).text().trim()),
      });
      byNominationFileId.set(nominationFileId, list);
    }

    return byNominationFileId;
  }

  received(query: {
    magistratId: string;
  }): Promise<{ dateReception: Date; id: string; nominationFileId: string }[]> {
    return this.db.tx.observation.findMany({
      select: { dateReception: true, id: true, nominationFileId: true } satisfies Prisma.ObservationSelect,
      where: { magistratId: query.magistratId },
    });
  }

  async observants(query: { nominationFileIds: ReadonlySet<string> }): Promise<Map<string, Observant[]>> {
    assertPgParams(query.nominationFileIds);

    const observations = await this.db.tx.observation.findMany({
      orderBy: [{ dateReception: 'asc' }, { id: 'asc' }],
      select: {
        magistrat: { select: { firstName: true, id: true, lastName: true, usedName: true } },
        nominationFileId: true,
      } satisfies Prisma.ObservationSelect,
      where: { nominationFileId: { in: [...query.nominationFileIds] } },
    });

    const byNominationFileId = new Map<string, Observant[]>();
    for (const { magistrat, nominationFileId } of observations) {
      const list = byNominationFileId.get(nominationFileId) ?? [];
      list.push(magistrat);
      byNominationFileId.set(nominationFileId, list);
    }

    return byNominationFileId;
  }
}
