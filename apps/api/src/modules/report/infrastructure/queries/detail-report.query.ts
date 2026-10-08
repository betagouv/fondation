import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { differenceInMonths, differenceInYears, formatDuration } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Prisma } from 'src/generated/prisma/client';
import { Clock } from 'src/modules/framework/clock';
import { Db } from 'src/modules/framework/database';
import { Files } from 'src/modules/framework/files';
import { TransparenceService } from 'src/modules/session/transparence/infrastructure/transparence.service';
import { FormationEnum } from 'src/modules/shared/formation.enum';
import { GradeEnum } from 'src/modules/shared/grade.enum';
import { prismaFormationEnumToFormationEnum } from 'src/modules/shared/mappers/formation.mapper';
import { prismaPrioriteEnumToPriorityEnum } from 'src/modules/shared/mappers/priorite.mapper';
import { prismaReportStateEnumToReportState } from 'src/modules/shared/mappers/rapport-statut.mapper';
import { prismaReportFileUsageEnumToReportFileUsage } from 'src/modules/shared/mappers/report-file-usage.mapper';
import { canScheduleAudition } from 'src/modules/shared/policies/nomination-file.policies';
import { PriorityEnum } from 'src/modules/shared/priority.enum';
import { ReportStateEnum } from 'src/modules/shared/report-state.enum';
import type { RoleEnum } from 'src/modules/shared/role.enum';
import { DateOnly, dateOnlyJsonSchema } from 'src/utils/date-only';
import { isDefined } from 'src/utils/is-defined';
import { timeOnlySchema } from 'src/utils/time-only';
import { fullname } from 'src/utils/user.util';

@Injectable()
export class DetailReportQuery {
  constructor(
    private readonly clock: Clock,
    private readonly files: Files,
    private readonly db: Db,

    @Inject(forwardRef(() => TransparenceService))
    private readonly transparences: TransparenceService,
  ) {}

  async handle(query: {
    reportId: string;
    user: { id: string; role: RoleEnum };
  }): Promise<DetailedReportDto> {
    const reporterId = query.user.role !== 'ADJOINT_SECRETAIRE_GENERAL' ? query.user.id : undefined;

    const report = await this.db.tx.report.findUnique({
      select: {
        comment: true,
        files: {
          select: {
            file: {
              select: {
                createdAt: true,
                createdBy: { select: { firstName: true, id: true, lastName: true } },
                id: true,
                name: true,
                path: true,
                sizeInBytes: true,
              },
            },
            usage: true,
          },
        },
        id: true,
        nominationFile: {
          select: {
            biography: true,
            birthDate: true,
            currentPosition: true,
            detectedJurisdiction: { select: { typeJur: true } },
            detectedJurisdictionId: true,
            detectedMagistrat: {
              select: { firstName: true, lastName: true, usedName: true },
            },
            detectedMagistratId: true,
            detectedTargetedFunctionId: true,
            grade: true,
            id: true,
            lastPositionDate: true,
            lastRankingDate: true,
            missingEvaluation: true,
            name: true,
            number: true,
            outcome: true,
            priorities: true,
            rank: true,
            session: {
              select: {
                archivedAt: true,
                date: true,
                formation: true,
                name: true,
                transparenceGds: { select: { dueDate: true } },
              },
            },
            targetedGrade: true,
            targetedPosition: true,
          },
        },
        reporterId: true,
        sessionId: true,
        state: true,
      } satisfies Prisma.ReportSelect,
      where: { id: query.reportId, isDeleted: false, reporterId },
    });

    if (!report) throw new NotFoundException();

    const audition = await this.transparences.internalFindSeenNominationFileAudition({
      nominationFileId: report.nominationFile.id,
      role: query.user.role,
    });

    const reportFiles = report.files.map(({ file, usage }) => ({
      addedAt: file.createdAt.toISOString(),
      addedBy: file.createdBy ? { id: file.createdBy.id, name: fullname(file.createdBy) } : null,
      id: file.id,
      name: file.name,
      path: file.path,
      size: file.sizeInBytes,
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
      attachments: attachments.map((f) => ({
        addedAt: f.addedAt,
        addedBy: f.addedBy,
        fileId: f.id,
        name: f.name,
        size: f.size,
        usage: f.usage,
      })),
      ...audition,
      biography: report.nominationFile.biography,
      birthDate: DateOnly.fromOptionalUtcDate(report.nominationFile.birthDate)?.toJson() ?? null,
      canScheduleAudition: canScheduleAudition(report.nominationFile, report.nominationFile.session),
      comment: report.comment,
      currentPosition: report.nominationFile.currentPosition,
      dateTransparence: DateOnly.fromUtcDate(report.nominationFile.session.date).toJson(),
      detectedMagistrat: report.nominationFile.detectedMagistrat,
      detectedMagistratId: report.nominationFile.detectedMagistratId,
      dueDate:
        DateOnly.fromOptionalUtcDate(report.nominationFile.session.transparenceGds?.dueDate)?.toJson() ??
        null,
      dureeDuPoste: this.lastPositionDuration(report.nominationFile.lastPositionDate),
      folderNumber: report.nominationFile.number,
      formation: prismaFormationEnumToFormationEnum(report.nominationFile.session.formation),
      grade: z.enum(GradeEnum).parse(report.nominationFile.grade),
      id: report.id,
      isArchived: !!report.nominationFile.session.archivedAt,
      missingEvaluation: report.nominationFile.missingEvaluation,
      name: report.nominationFile.name,
      nominationFileId: report.nominationFile.id,
      priorities: report.nominationFile.priorities.map(prismaPrioriteEnumToPriorityEnum),
      priority: report.nominationFile.priorities[0]
        ? prismaPrioriteEnumToPriorityEnum(report.nominationFile.priorities[0])
        : null,
      rank: report.nominationFile.rank,
      screenshots: screenshots.map((f) => ({
        fileId: f.id,
        name: f.name,
        url: f.url,
        usage: f.usage,
      })),
      sessionId: report.sessionId,
      state: prismaReportStateEnumToReportState(report.state),
      targetedGrade: z.enum(GradeEnum).nullable().parse(report.nominationFile.targetedGrade),
      targettedPosition: report.nominationFile.targetedPosition,
      transparency: report.nominationFile.session.name,
    };
  }

  private lastPositionDuration(lastPositionDate: Date | null): string | null {
    if (!isDefined(lastPositionDate)) return null;

    const now = this.clock.now();
    now.setUTCHours(0, 0, 0, 0);

    const years = differenceInYears(now, lastPositionDate);
    const months = differenceInMonths(now, lastPositionDate) - years * 12;

    return formatDuration({ months, years }, { delimiter: ' et ', locale: fr });
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
    auditionRequired: z.boolean(),
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
        size: z.number().int().nullable(),
        addedAt: z.iso.datetime(),
        addedBy: z.object({ id: z.string(), name: z.string() }).nullable(),
      }),
    ),
  }),
) {}
