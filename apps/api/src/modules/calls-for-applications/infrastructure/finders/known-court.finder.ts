import { Transactional, Propagation } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { Prisma } from '../../../../generated/prisma/client';
import { Clock } from '../../../framework/clock';
import { Db } from '../../../framework/database';
import { HEADED_BY_CSM_COURT_TYPE_IDS, isOpenCourtHeadedByCsm } from '../../../shared/court';
import { type KnownCourt, targetCourtTypeOf } from '../../domain/call-for-applications';

@Injectable()
export class KnownCourtFinder {
  constructor(
    private readonly clock: Clock,
    private readonly db: Db,
  ) {}

  /** a removed court stays known so that a call which already targets it keeps it */
  @Transactional(Propagation.Mandatory)
  async among(courtIds: readonly string[]): Promise<ReadonlyMap<string, KnownCourt>> {
    const courts = await this.db.tx.jurisdiction.findMany({
      select: { codejur: true, dateSuppression: true, typeJur: true } satisfies Prisma.JurisdictionSelect,
      where: { codejur: { in: [...courtIds] }, typeJur: { in: [...HEADED_BY_CSM_COURT_TYPE_IDS] } },
    });
    const now = this.clock.now();

    return new Map(
      courts.map((court) => [
        court.codejur,
        { targetable: isOpenCourtHeadedByCsm(court, now), type: targetCourtTypeOf(court.typeJur) },
      ]),
    );
  }
}
