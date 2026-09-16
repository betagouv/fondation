import { Injectable, NotFoundException } from '@nestjs/common';
import { differenceInMonths, differenceInYears, formatDuration } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Clock } from 'src/modules/framework/clock';
import { Db } from 'src/modules/framework/database';
import { Files } from 'src/modules/framework/files';
import { FormationEnum } from 'src/modules/shared/formation.enum';
import { GradeEnum } from 'src/modules/shared/grade.enum';
import { prismaFormationEnumToFormationEnum } from 'src/modules/shared/mappers/formation.mapper';
import { prismaPrioriteEnumToPriorityEnum } from 'src/modules/shared/mappers/priorite.mapper';
import { prismaReportStateEnumToReportState } from 'src/modules/shared/mappers/rapport-statut.mapper';
import { prismaReportFileUsageEnumToReportFileUsage } from 'src/modules/shared/mappers/report-file-usage.mapper';
import { isAuditionExpected } from 'src/modules/shared/policies/auditioned-position.policy';
import { canScheduleAudition } from 'src/modules/shared/policies/nomination-file.policies';
import { PriorityEnum } from 'src/modules/shared/priority.enum';
import { ReportStateEnum } from 'src/modules/shared/report-state.enum';
import type { RoleEnum } from 'src/modules/shared/role.enum';
import { DateOnly, dateOnlyJsonSchema } from 'src/utils/date-only';
import { isDefined } from 'src/utils/is-defined';
import { dateToTimeOnly, timeOnlySchema } from 'src/utils/time-only';

@Injectable()
export class DetailReportQuery {
  constructor(
    private readonly clock: Clock,
    private readonly files: Files,
    private readonly db: Db,
  ) {}

  async handle(query: {
    user: { id: string; role: RoleEnum };
    reportId: string;
  }): Promise<DetailedReportDto> {
    const reporterId = query.user.role !== 'ADJOINT_SECRETAIRE_GENERAL' ? query.user.id : undefined;

    const report = await this.db.tx.report.findUnique({
      where: { id: query.reportId, reporterId, isDeleted: false },
      select: {
        reporterId: true,
        id: true,
        comment: true,
        sessionId: true,
        state: true,
        files: {
          select: {
            usage: true,
            file: { select: { id: true, name: true, path: true } },
          },
        },
        nominationFile: {
          select: {
            id: true,
            name: true,
            detectedMagistratId: true,
            detectedMagistrat: {
              select: { firstName: true, lastName: true, usedName: true },
            },
            biography: true,
            number: true,
            birthDate: true,
            grade: true,
            currentPosition: true,
            targetedGrade: true,
            targetedPosition: true,
            rank: true,
            lastPositionDate: true,
            lastRankingDate: true,
            priorities: true,
            outcome: true,
            auditionDate: true,
            auditionTime: true,
            missingEvaluation: true,
            detectedJurisdictionId: true,
            detectedTargetedFunctionId: true,

            session: {
              select: {
                name: true,
                date: true,
                formation: true,
                archivedAt: true,

                transparenceGds: { select: { dueDate: true } },
              },
            },
          },
        },
      },
    });

    if (!report) throw new NotFoundException();

    const reportFiles = report.files.map(({ usage, file }) => ({
      id: file.id,
      name: file.name,
      path: file.path,
      usage: prismaReportFileUsageEnumToReportFileUsage(usage),
    }));

    const attachments = reportFiles.filter(
      (x): x is typeof x & { usage: 'ATTACHMENT' } => x.usage === 'ATTACHMENT',
    );

    const screenshots = await this.withUrls(
      reportFiles.filter(
        (x): x is typeof x & { usage: 'EMBEDDED_SCREENSHOT' } => x.usage === 'EMBEDDED_SCREENSHOT',
      ),
    );

    return {
      id: report.id,
      sessionId: report.sessionId,
      nominationFileId: report.nominationFile.id,
      comment: report.comment,
      state: prismaReportStateEnumToReportState(report.state),
      isArchived: !!report.nominationFile.session.archivedAt,

      attachments: attachments.map((f) => ({
        fileId: f.id,
        name: f.name,
        usage: f.usage,
      })),

      screenshots: screenshots.map((f) => ({
        fileId: f.id,
        name: f.name,
        url: f.url,
        usage: f.usage,
      })),

      auditionDate: DateOnly.fromOptionalUtcDate(report.nominationFile.auditionDate)?.toJson() ?? null,
      auditionExpected: isAuditionExpected(report.nominationFile),
      auditionTime: report.nominationFile.auditionTime
        ? dateToTimeOnly(report.nominationFile.auditionTime)
        : null,
      canScheduleAudition: canScheduleAudition(report.nominationFile, report.nominationFile.session),
      missingEvaluation: report.nominationFile.missingEvaluation,

      biography: report.nominationFile.biography,
      birthDate: DateOnly.fromOptionalUtcDate(report.nominationFile.birthDate)?.toJson() ?? null,
      currentPosition: report.nominationFile.currentPosition,
      dureeDuPoste: this.lastPositionDuration(report.nominationFile.lastPositionDate),
      folderNumber: report.nominationFile.number,
      grade: z.enum(GradeEnum).parse(report.nominationFile.grade),
      rank: report.nominationFile.rank,
      targetedGrade: z.enum(GradeEnum).nullable().parse(report.nominationFile.targetedGrade),
      targettedPosition: report.nominationFile.targetedPosition,
      priorities: report.nominationFile.priorities.map(prismaPrioriteEnumToPriorityEnum),
      priority: report.nominationFile.priorities[0]
        ? prismaPrioriteEnumToPriorityEnum(report.nominationFile.priorities[0])
        : null,

      dateTransparence: DateOnly.fromUtcDate(report.nominationFile.session.date).toJson(),
      dueDate:
        DateOnly.fromOptionalUtcDate(report.nominationFile.session.transparenceGds?.dueDate)?.toJson() ??
        null,
      formation: prismaFormationEnumToFormationEnum(report.nominationFile.session.formation),
      transparency: report.nominationFile.session.name,
      name: report.nominationFile.name,
      detectedMagistratId: report.nominationFile.detectedMagistratId,
      detectedMagistrat: report.nominationFile.detectedMagistrat,
    };
  }

  private lastPositionDuration(lastPositionDate: Date | null): string | null {
    if (!isDefined(lastPositionDate)) return null;

    const now = this.clock.now();
    now.setUTCHours(0, 0, 0, 0);

    const years = differenceInYears(now, lastPositionDate);
    const months = differenceInMonths(now, lastPositionDate) - years * 12;

    return formatDuration({ months, years }, { locale: fr, delimiter: ' et ' });
  }

  private async withUrls<F extends { id: string; name: string; path: readonly string[] }>(
    files: readonly F[],
  ): Promise<(F & { url: string })[]> {
    const byId = new Map(files.map((f) => [f.id, f]));
    const urls = await this.files.getPublicUrls(Array.from(byId.keys()));

    return Object.entries(urls)
      .map(([path, url]) => {
        const originalFile = byId.get(path);
        if (!originalFile) return undefined;

        return { ...originalFile, url: url.toString() };
      })
      .filter(isDefined);
  }
}

export class DetailedReportDto extends createZodDto(
  z.object({
    id: z.string(),
    sessionId: z.string(),
    nominationFileId: z.string(),
    name: z.string(),
    detectedMagistratId: z.string().nullable(),
    detectedMagistrat: z
      .object({
        firstName: z.string(),
        lastName: z.string(),
        usedName: z.string().nullable(),
      })
      .nullable(),
    comment: z.string().nullable(),
    formation: z.enum(FormationEnum),
    state: z.enum(ReportStateEnum),
    isArchived: z.boolean(),
    auditionDate: dateOnlyJsonSchema.nullable(),
    auditionExpected: z.boolean(),
    auditionTime: timeOnlySchema.nullable(),
    canScheduleAudition: z.boolean(),
    missingEvaluation: z.boolean(),
    folderNumber: z.number().nullable(),
    biography: z.string().nullable(),
    dueDate: dateOnlyJsonSchema.nullable(),
    birthDate: dateOnlyJsonSchema.nullable(),
    transparency: z.string(),
    dateTransparence: dateOnlyJsonSchema,
    grade: z.enum(GradeEnum),
    currentPosition: z.string().nullable(),
    targetedGrade: z.enum(GradeEnum).nullable(),
    targettedPosition: z.string().nullable(),
    rank: z.string().nullable(),
    dureeDuPoste: z.string().nullable(),
    priorities: z.array(z.enum(PriorityEnum)),
    priority: z.enum(PriorityEnum).nullable().meta({ deprecated: true, description: 'prefer priorities' }),

    screenshots: z.array(
      z.object({
        usage: z.enum(['EMBEDDED_SCREENSHOT']),
        name: z.string(),
        fileId: z.string(),
        url: z.url(),
      }),
    ),

    attachments: z.array(
      z.object({
        usage: z.enum(['ATTACHMENT']),
        name: z.string(),
        fileId: z.string(),
      }),
    ),
  }),
) {}
