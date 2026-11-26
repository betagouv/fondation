import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Prisma } from '../../../../generated/prisma/client';
import { COMMENT_MAX_LENGTH } from '../../../../utils/comment';
import { TYPED_DATE_RANGE } from '../../../../utils/date-only';
import { Clock } from '../../../framework/clock';
import { Db } from '../../../framework/database';
import { HEADED_BY_CSM_COURT_TYPE_IDS, isOpenCourtHeadedByCsm } from '../../../shared/court';
import { COURT_OF_CASSATION_POSITIONS } from '../../../shared/court-of-cassation-position.enum';
import {
  CALL_FOR_APPLICATIONS_TYPES,
  callForApplicationsTypeOptionOf,
  guidelinesAdaptationLabelOf,
  sortedCourts,
  TARGET_COURT_TYPES,
  TARGET_PICKS,
  targetCourtOf,
  targetCourtTypeOptionOf,
  targetPositionOf,
} from '../../domain/call-for-applications';
import {
  callForApplicationsTypeSchema,
  targetCourtSchema,
  targetCourtTypeSchema,
  targetPositionSchema,
} from '../call-for-applications.dto';

@Injectable()
export class FindCallForApplicationsFormQuery {
  constructor(
    private readonly clock: Clock,
    private readonly db: Db,
  ) {}

  async handle(): Promise<FoundCallForApplicationsFormDto> {
    const courts = await this.db.tx.jurisdiction.findMany({
      select: {
        codejur: true,
        dateSuppression: true,
        libelle: true,
        typeJur: true,
        ville_jur: true,
      } satisfies Prisma.JurisdictionSelect,
      where: { typeJur: { in: [...HEADED_BY_CSM_COURT_TYPE_IDS] } },
    });
    const now = this.clock.now();
    const targetable = sortedCourts(courts.filter((court) => isOpenCourtHeadedByCsm(court, now))).map(
      targetCourtOf,
    );

    return {
      commentMaxLength: COMMENT_MAX_LENGTH,
      dateRange: TYPED_DATE_RANGE,
      targetCourtTypes: TARGET_COURT_TYPES.map((type) => ({
        courts: targetable.filter((court) => court.type === type),
        guidelinesAdaptationLabel: guidelinesAdaptationLabelOf(type),
        type: targetCourtTypeOptionOf(type),
      })),
      targetPositions: COURT_OF_CASSATION_POSITIONS.map(targetPositionOf),
      types: CALL_FOR_APPLICATIONS_TYPES.map(callForApplicationsTypeOptionOf),
    };
  }
}

export class FoundCallForApplicationsFormDto extends createZodDto(
  z.object({
    commentMaxLength: z.number().int(),
    dateRange: z.object({ max: z.iso.date(), min: z.iso.date() }),
    /** the courts a specific call may target grouped by type */
    targetCourtTypes: z.array(
      z.object({
        courts: z.array(targetCourtSchema),
        /** the switch that adapts the management guidelines for this type */
        guidelinesAdaptationLabel: z.string(),
        type: targetCourtTypeSchema,
      }),
    ),
    targetPositions: z.array(targetPositionSchema),
    /** each type with the hint shown under the field and what the agent picks as its target */
    types: z.array(
      z.object({ scope: z.string(), targetPick: z.enum(TARGET_PICKS), type: callForApplicationsTypeSchema }),
    ),
  }),
) {}
