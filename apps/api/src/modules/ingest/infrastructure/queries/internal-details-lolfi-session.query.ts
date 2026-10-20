import { Transactional } from '@nestjs-cls/transactional';
import { Injectable, Logger } from '@nestjs/common';
import z from 'zod';

import { detailLolfiSessionRawQuery } from '../../../../generated/prisma/sql';
import { assertIsDefined } from '../../../../utils/is-defined';
import { Db } from '../../../framework/database';
import { FormationEnum } from '../../../shared/formation.enum';
import { GradeEnum } from '../../../shared/grade.enum';
import { prismaFormationEnumToFormationEnum } from '../../../shared/mappers/formation.mapper';
import { PriorityEnum } from '../../../shared/priority.enum';

@Injectable()
export class InternalDetailsLolfiSessionQuery {
  private logger = new Logger(InternalDetailsLolfiSessionQuery.name);

  constructor(private readonly db: Db) {}

  @Transactional()
  async handle(sessionId: number): Promise<DetailedLolfiSession> {
    const nominationFiles = await this.db.tx.$queryRawTyped(detailLolfiSessionRawQuery(sessionId));
    const perPositionId = Map.groupBy(nominationFiles, (file) => file.detectedTargetedPositionId);

    const GradeSchema = z.enum(GradeEnum);
    const items: DetailedLolfiSession['items'] = [];
    for (const [positionId, files] of perPositionId) {
      const designatedFiles = files.filter(({ isDesignated }) => isDesignated);
      if (!designatedFiles.length) {
        this.logger.warn(`no designated nomination in session ${sessionId} on position ${positionId}`);
        continue;
      }

      for (const file of designatedFiles) {
        if (!file.formation) {
          this.logger.warn(`Magistrat ${file.magistratExternalId} has no formation`);
          continue;
        }

        if (!file.targetedPosition) {
          this.logger.warn(`Magistrat ${file.magistratExternalId} has no targeted position`);
          continue;
        }

        items.push({
          externalId: file.externalId,
          lastRankingDate: file.lastRankingDate,
          lastPositionDate: file.lastPositionDate,
          detectedJurisdictionId: file.detectedJurisdictionId,
          detectedTargetedFunctionId: file.detectedTargetedFunctionId,
          detectedTargetedPositionId: file.detectedTargetedPositionId,
          sortableTargetedGrade: file.sortableTargetedGrade,
          targetedGrade: GradeSchema.parse(file.targetedGrade),
          targetedPosition: file.targetedPosition,
          formation: prismaFormationEnumToFormationEnum(file.formation),
          rank: `(${file.rank} sur une liste de ${files.length})`,
          priorities: ([] as PriorityEnum[]).concat(
            file.isOutreMer ? ['OUTRE_MER'] : [],
            file.isProfiled ? ['PROFILE'] : [],
          ),
          magistrat: {
            id: file.magistratId,
            externalId: assertIsDefined(file.magistratExternalId),
            name: assertIsDefined(file.magistratFullName),
            birthDate: file.magistratBirthDate,
            biography: file.magistratBiography,
            grade: await GradeSchema.parseAsync(file.magistratGrade),
            currentPosition: file.magistratCurrentPosition,
          },
        });
      }
    }

    return { items };
  }
}

export type DetailedLolfiSession = {
  items: {
    externalId: number;
    rank: string;
    lastRankingDate: Date | null;
    lastPositionDate: Date | null;
    formation: FormationEnum;
    targetedPosition: string | null;
    targetedGrade: GradeEnum;
    sortableTargetedGrade: number;
    detectedTargetedPositionId: number | null;
    detectedTargetedFunctionId: string | null;
    detectedJurisdictionId: string | null;
    priorities: PriorityEnum[];
    magistrat: {
      id: string;
      externalId: number;
      name: string;
      birthDate: Date | null;
      biography: string | null;
      grade: GradeEnum;
      currentPosition: string | null;
    };
  }[];
};
