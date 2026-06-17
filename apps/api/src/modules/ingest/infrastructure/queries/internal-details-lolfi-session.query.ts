import { Injectable, Logger } from '@nestjs/common';
import z from 'zod';

import { Magistrat, PrioriteEnum } from 'shared-models';

import { detailLolfiSessionRawQuery } from 'src/generated/prisma/sql';
import { PrismaService } from 'src/modules/framework/database';
import { prismaFormationEnumToFormationEnum } from 'src/modules/shared/mappers/formation.mapper';
import { assertIsDefined } from 'src/utils/is-defined';

@Injectable()
export class InternalDetailsLolfiSessionQuery {
  private logger = new Logger(InternalDetailsLolfiSessionQuery.name);

  constructor(private readonly prisma: PrismaService) {}

  async handle(sessionId: number): Promise<DetailedLolfiSession> {
    const nominationFiles = await this.prisma.$queryRawTyped(detailLolfiSessionRawQuery(sessionId));
    const perPositionId = Map.groupBy(nominationFiles, (file) => file.detectedTargetedPositionId);

    const GradeSchema = z.enum(Magistrat.Grade);
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
          priorities: ([] as PrioriteEnum[]).concat(
            file.isOutreMer ? [PrioriteEnum.OUTRE_MER] : [],
            file.isProfiled ? [PrioriteEnum.PROFILE] : [],
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
    formation: Magistrat.Formation;
    targetedPosition: string | null;
    targetedGrade: Magistrat.Grade;
    sortableTargetedGrade: number;
    detectedTargetedPositionId: number | null;
    detectedTargetedFunctionId: string | null;
    detectedJurisdictionId: string | null;
    priorities: PrioriteEnum[];
    magistrat: {
      id: string;
      externalId: number;
      name: string;
      birthDate: Date | null;
      biography: string | null;
      grade: Magistrat.Grade;
      currentPosition: string | null;
    };
  }[];
};
