import { Transactional, Propagation } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { Prisma } from '../../../../generated/prisma/client';
import { Clock } from '../../../framework/clock';
import { Db } from '../../../framework/database';
import { isOpenCourtHeadedByCsm } from '../../../shared/court';

@Injectable()
export class TargetableCourtFinder {
  constructor(
    private readonly clock: Clock,
    private readonly db: Db,
  ) {}

  @Transactional(Propagation.Mandatory)
  async among(courtIds: readonly string[]): Promise<ReadonlySet<string>> {
    const courts = await this.db.tx.jurisdiction.findMany({
      select: { codejur: true, dateSuppression: true, typeJur: true } satisfies Prisma.JurisdictionSelect,
      where: { codejur: { in: [...courtIds] } },
    });
    const now = this.clock.now();

    return new Set(
      courts.filter((court) => isOpenCourtHeadedByCsm(court, now)).map(({ codejur }) => codejur),
    );
  }
}
