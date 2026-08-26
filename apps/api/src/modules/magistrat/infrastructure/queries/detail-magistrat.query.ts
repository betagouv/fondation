import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Db } from 'src/modules/framework/database';
import { GradeEnum } from 'src/modules/shared/grade.enum';
import { isGrade } from 'src/modules/shared/mappers/grade.mapper';
import { buildMagistratLolfiUrl } from 'src/utils/build-magistrat-lolfi-url';
import { DateOnly, dateOnlyJsonSchema } from 'src/utils/date-only';

@Injectable()
export class DetailMagistratQuery {
  constructor(private readonly db: Db) {}

  async handle(query: { magistratId: string }): Promise<DetailedMagistratDto> {
    return this.db.withTransaction(async () => {
      const magistrat = await this.db.tx.magistrat.findUnique({
        where: { id: query.magistratId },
        select: {
          id: true,
          civilite: true,
          firstName: true,
          lastName: true,
          usedName: true,
          birthDate: true,
          grade: true,
          gradeDate: true,
          nominationDate: true,
          installationDate: true,
          professionalEmail: true,
          careerHistory: true,
          currentPositionId: true,
          externalId: true,
        },
      });

      if (!magistrat) throw new NotFoundException();

      const currentPosition = await this.currentPosition(magistrat.currentPositionId);

      return {
        id: magistrat.id,
        civilite: magistrat.civilite,
        firstName: magistrat.firstName,
        lastName: magistrat.lastName,
        usedName: magistrat.usedName,
        birthDate: magistrat.birthDate ? DateOnly.fromUtcDate(magistrat.birthDate).toJson() : null,
        grade: magistrat.grade,
        gradeDate: magistrat.gradeDate ? DateOnly.fromUtcDate(magistrat.gradeDate).toJson() : null,
        nominationDate: magistrat.nominationDate
          ? DateOnly.fromUtcDate(magistrat.nominationDate).toJson()
          : null,
        installationDate: magistrat.installationDate
          ? DateOnly.fromUtcDate(magistrat.installationDate).toJson()
          : null,
        professionalEmail: magistrat.professionalEmail,
        currentPosition,
        careerHistory: magistrat.careerHistory,
        externalUrl: buildMagistratLolfiUrl(magistrat.externalId),
      };
    });
  }

  private async currentPosition(currentPositionId: string | null) {
    const positionId = Number.parseInt(currentPositionId ?? '', 10);
    if (!Number.isFinite(positionId)) return null;

    const position = await this.db.tx.position.findUnique({
      where: { id: positionId },
      select: {
        id: true,
        gradeId: true,
        function: { select: { id: true, label: true } },
        jurisdiction: { select: { codejur: true, libelle: true } },
      },
    });

    if (!position) return null;

    return {
      id: position.id,
      grade: isGrade(position.gradeId) ? position.gradeId : null,
      function: position.function,
      jurisdiction: { id: position.jurisdiction.codejur, label: position.jurisdiction.libelle },
    };
  }
}

const PositionSchema = z.object({
  id: z.number().int(),
  grade: z.enum(GradeEnum).nullable(),
  function: z.object({ id: z.string(), label: z.string() }).nullable(),
  jurisdiction: z.object({ id: z.string(), label: z.string().nullable() }),
});

export class DetailedMagistratDto extends createZodDto(
  z.object({
    id: z.string(),
    civilite: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    usedName: z.string().nullable(),
    birthDate: dateOnlyJsonSchema.nullable(),
    grade: z.string().nullable(),
    gradeDate: dateOnlyJsonSchema.nullable(),
    nominationDate: dateOnlyJsonSchema.nullable(),
    installationDate: dateOnlyJsonSchema.nullable(),
    professionalEmail: z.string().nullable(),
    currentPosition: PositionSchema.nullable(),
    careerHistory: z.string().nullable(),
    externalUrl: z.url(),
  }),
) {}
