import { Injectable, NotFoundException } from '@nestjs/common';
import { differenceInMonths, differenceInYears, formatDuration } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Clock } from 'src/modules/framework/clock';
import { Db } from 'src/modules/framework/database';
import { Files } from 'src/modules/framework/files';
import { FILE_MIME_TYPES, filenameToMimeType } from 'src/modules/framework/files/mime-type';
import { FormationEnum } from 'src/modules/shared/formation.enum';
import { GradeEnum } from 'src/modules/shared/grade.enum';
import { prismaFormationEnumToFormationEnum } from 'src/modules/shared/mappers/formation.mapper';
import { prismaPrioriteEnumToPriorityEnum } from 'src/modules/shared/mappers/priorite.mapper';
import { prismaReportStateEnumToReportState } from 'src/modules/shared/mappers/rapport-statut.mapper';
import { prismaReportFileUsageEnumToReportFileUsage } from 'src/modules/shared/mappers/report-file-usage.mapper';
import { isAuditionExpected } from 'src/modules/shared/policies/auditioned-position.policy';
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
            biography: true,
            number: true,
            birthDate: true,
            grade: true,
            currentPosition: true,
            targetedGrade: true,
            targetedPosition: true,
            rank: true,
            observers: true,
            lastPositionDate: true,
            lastRankingDate: true,
            priorities: true,
            comment: true,
            auditionDate: true,
            auditionTime: true,
            missingEvaluation: true,
            detectedJurisdictionId: true,
            detectedTargetedFunctionId: true,

            summary: {
              select: {
                content: true,
                readers: { select: { userId: true } },
                screenshots: {
                  select: {
                    file: { select: { id: true, name: true, path: true } },
                  },
                },
                attachments: {
                  select: {
                    file: { select: { id: true, name: true, path: true } },
                  },
                },
              },
            },

            session: {
              select: {
                name: true,
                date: true,
                formation: true,
                archivedAt: true,

                transparenceGds: { select: { dueDate: true } },
              },
            },

            observations: {
              select: {
                id: true,
                dateReception: true,
                description: true,
                memberComments: {
                  where: { userId: query.user.id },
                  select: { comment: true },
                },
                magistrat: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    usedName: true,
                  },
                },
              },
              orderBy: { dateReception: 'desc' },
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

    let summary: DetailedReportDto['summary'] = null;
    if (report.nominationFile.summary?.readers.some((r) => r.userId === query.user.id)) {
      const summaryScreenshots = await this.withUrls(
        report.nominationFile.summary.screenshots.map(({ file }) => file),
      );

      summary = {
        content: report.nominationFile.summary.content,
        screenshots: summaryScreenshots.map((f) => ({
          fileId: f.id,
          name: f.name,
          type: filenameToMimeType(f.name) ?? FILE_MIME_TYPES.bin,
          url: f.url,
        })),
        attachments: report.nominationFile.summary.attachments.map(({ file }) => ({
          fileId: file.id,
          name: file.name,
          type: filenameToMimeType(file.name) ?? FILE_MIME_TYPES.bin,
        })),
      };
    }

    return {
      id: report.id,
      sessionId: report.sessionId,
      nominationFileId: report.nominationFile.id,
      comment: report.comment,
      state: prismaReportStateEnumToReportState(report.state),
      summary,
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

      auditionDate: DateOnly.fromOptionalDate(report.nominationFile.auditionDate)?.toJson() ?? null,
      auditionExpected: isAuditionExpected(report.nominationFile),
      auditionTime: report.nominationFile.auditionTime
        ? dateToTimeOnly(report.nominationFile.auditionTime)
        : null,
      missingEvaluation: report.nominationFile.missingEvaluation,

      biography: report.nominationFile.biography,
      birthDate: DateOnly.fromOptionalDate(report.nominationFile.birthDate)?.toJson() ?? null,
      currentPosition: report.nominationFile.currentPosition,
      dureeDuPoste: this.lastPositionDuration(report.nominationFile.lastPositionDate),
      folderNumber: report.nominationFile.number,
      grade: z.enum(GradeEnum).parse(report.nominationFile.grade),
      observers: report.nominationFile.observers,
      rank: report.nominationFile.rank,
      fileComment: report.nominationFile.comment,
      targetedGrade: z.enum(GradeEnum).nullable().parse(report.nominationFile.targetedGrade),
      targettedPosition: report.nominationFile.targetedPosition,
      priorities: report.nominationFile.priorities.map(prismaPrioriteEnumToPriorityEnum),
      priority: report.nominationFile.priorities[0]
        ? prismaPrioriteEnumToPriorityEnum(report.nominationFile.priorities[0])
        : null,

      dateTransparence: DateOnly.fromDate(report.nominationFile.session.date).toJson(),
      dueDate:
        DateOnly.fromOptionalDate(report.nominationFile.session.transparenceGds?.dueDate)?.toJson() ?? null,
      formation: prismaFormationEnumToFormationEnum(report.nominationFile.session.formation),
      transparency: report.nominationFile.session.name,
      name: report.nominationFile.name,
      detectedMagistratId: report.nominationFile.detectedMagistratId,

      observations: report.nominationFile.observations.map((obs) => ({
        id: obs.id,
        dateReception: DateOnly.fromDate(obs.dateReception).toJson(),
        magistrat: obs.magistrat,
        hasDescription: !!obs.description.trim(),
        hasUserComment: obs.memberComments.some(({ comment }) => !!comment.trim()),
      })),
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
    comment: z.string().nullable(),
    formation: z.enum(FormationEnum),
    state: z.enum(ReportStateEnum),
    isArchived: z.boolean(),
    auditionDate: dateOnlyJsonSchema.nullable(),
    auditionExpected: z.boolean(),
    auditionTime: timeOnlySchema.nullable(),
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
    observers: z.array(z.string()),
    dureeDuPoste: z.string().nullable(),
    priorities: z.array(z.enum(PriorityEnum)),
    priority: z.enum(PriorityEnum).nullable().meta({ deprecated: true, description: 'prefer priorities' }),
    fileComment: z.string().nullable(),

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

    summary: z
      .object({
        content: z.string(),
        attachments: z.array(z.object({ fileId: z.string(), name: z.string(), type: z.string() })),
        screenshots: z.array(
          z.object({
            fileId: z.string(),
            name: z.string(),
            type: z.string(),
            url: z.url(),
          }),
        ),
      })
      .nullable(),

    observations: z.array(
      z.object({
        id: z.string(),
        dateReception: dateOnlyJsonSchema,
        hasDescription: z.boolean(),
        hasUserComment: z.boolean(),
        magistrat: z.object({
          id: z.string(),
          firstName: z.string(),
          lastName: z.string(),
          usedName: z.string().nullable(),
        }),
      }),
    ),
  }),
) {}
