import { Injectable, NotFoundException } from '@nestjs/common';

import { Prisma } from '../../../../generated/prisma/client';
import { DateOnly } from '../../../../utils/date-only';
import { Clock } from '../../../framework/clock';
import { Db } from '../../../framework/database';
import type { Civility } from '../../../magistrat/domain/magistrat-name';
import { isRemovedCourt } from '../../../shared/court';
import { civilityOf } from '../../domain/holder-title';
import type { WatchedPosition } from '../../domain/position-alert';
import { watchedPositionOf } from '../../domain/watched-position';

export type HeldPosition = {
  birthDate: DateOnly | null;
  civility: Civility | null;
  courtId: string;
  installationDate: DateOnly | null;
  positionId: number;
  watched: WatchedPosition;
};

@Injectable()
export class HeldPositionFinder {
  constructor(
    private readonly clock: Clock,
    private readonly db: Db,
  ) {}

  /**
   * the position LOLFI gives the magistrat today carries the vacancies declared on them: not found unless a
   * table of the veille lists it
   */
  async byHolder({ magistratId }: { magistratId: string }): Promise<HeldPosition> {
    const magistrat = await this.db.tx.magistrat.findUnique({
      select: {
        birthDate: true,
        civilite: true,
        currentPositionId: true,
        installationDate: true,
        status: true,
      } satisfies Prisma.MagistratSelect,
      where: { id: magistratId },
    });
    const positionId = Number.parseInt(magistrat?.currentPositionId ?? '', 10);
    if (magistrat?.status !== 'ACTIVE' || !Number.isFinite(positionId)) throw new NotFoundException();

    const position = await this.db.tx.position.findUnique({
      select: {
        functionId: true,
        gradeId: true,
        jurisdiction: { select: { codejur: true, dateSuppression: true, typeJur: true } },
      } satisfies Prisma.PositionSelect,
      where: { id: positionId },
    });
    const removed = position && isRemovedCourt(position.jurisdiction.dateSuppression, this.clock.now());
    const watched =
      position &&
      !removed &&
      watchedPositionOf({
        courtTypeId: position.jurisdiction.typeJur,
        functionId: position.functionId,
        gradeId: position.gradeId,
        jurisdictionId: position.jurisdiction.codejur,
      });
    if (!watched) throw new NotFoundException();

    return {
      birthDate: DateOnly.fromOptionalUtcDate(magistrat.birthDate),
      civility: civilityOf(magistrat.civilite),
      courtId: position.jurisdiction.codejur,
      installationDate: DateOnly.fromOptionalUtcDate(magistrat.installationDate),
      positionId,
      watched,
    };
  }
}
