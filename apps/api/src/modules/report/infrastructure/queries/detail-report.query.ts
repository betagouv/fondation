import { Injectable, NotFoundException } from '@nestjs/common';
import {
  differenceInMonths,
  differenceInYears,
  formatDuration,
} from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import {
  dateOnlyJsonSchema,
  Magistrat,
  NominationFile,
  PrioriteEnum,
  ReportFileUsage,
  Role,
} from 'shared-models';

import { Clock } from 'src/modules/framework/clock';
import { PrismaService } from 'src/modules/framework/database';
import { Files } from 'src/modules/framework/files';
import { prismaFormationEnumToFormationEnum } from 'src/modules/shared/mappers/formation.mapper';
import { prismaPrioriteEnumToPrioriteEnum } from 'src/modules/shared/mappers/priorite.mapper';
import { prismaReportStateEnumToReportState } from 'src/modules/shared/mappers/rapport-statut.mapper';
import { prismaReportFileUsageEnumToReportFileUsage } from 'src/modules/shared/mappers/report-file-usage.mapper';
import { DateOnly } from 'src/utils/date-only';
import { isDefined } from 'src/utils/is-defined';

@Injectable()
export class DetailReportQuery {
  constructor(
    private readonly clock: Clock,
    private readonly files: Files,
    private readonly prisma: PrismaService,
  ) {}

  async handle(query: {
    user: { id: string; role: Role };
    reportId: string;
  }): Promise<DetailedReportDto> {
    const reporterId =
      query.user.role !== Role.ADJOINT_SECRETAIRE_GENERAL
        ? query.user.id
        : undefined;

    const report = await this.prisma.report.findUnique({
      where: { id: query.reportId, reporterId },
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
        reportRules: {
          select: {
            id: true,
            ruleGroup: true,
            ruleName: true,
            validated: true,
          },
        },
        nominationFile: {
          select: {
            name: true,
            biography: true,
            number: true,
            birthDate: true,
            grade: true,
            currentPosition: true,
            targetedPosition: true,
            rank: true,
            observers: true,
            lastPositionDate: true,
            lastRankingDate: true,
            priorite: true,

            session: {
              select: {
                name: true,
                date: true,
                formation: true,
                dueDate: true,
              },
            },
          },
        },
      },
    });

    if (!report) throw new NotFoundException();

    const rulesByRuleName = new Map(
      report.reportRules.map((r) => [r.ruleName, r]),
    );

    const reportFiles = report.files.map(({ usage, file }) => ({
      id: file.id,
      name: file.name,
      path: file.path,
      usage: prismaReportFileUsageEnumToReportFileUsage(usage),
    }));

    const attachments = reportFiles.filter(
      (x): x is typeof x & { usage: ReportFileUsage.ATTACHMENT } =>
        x.usage === ReportFileUsage.ATTACHMENT,
    );

    const screenshots = await this.withUrls(
      reportFiles.filter(
        (x): x is typeof x & { usage: ReportFileUsage.EMBEDDED_SCREENSHOT } =>
          x.usage === ReportFileUsage.EMBEDDED_SCREENSHOT,
      ),
    );

    return {
      id: report.id,
      sessionId: report.id,
      comment: report.comment,
      state: prismaReportStateEnumToReportState(report.state),

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

      biography: report.nominationFile.biography,
      birthDate:
        DateOnly.fromOptionalDate(report.nominationFile.birthDate)?.toJson() ??
        null,
      currentPosition: report.nominationFile.currentPosition,
      dureeDuPoste: this.lastPositionDuration(
        report.nominationFile.lastPositionDate,
      ),
      folderNumber: report.nominationFile.number,
      grade: z.enum(Magistrat.Grade).parse(report.nominationFile.grade),
      observers: report.nominationFile.observers,
      rank: report.nominationFile.rank,
      targettedPosition: report.nominationFile.targetedPosition,
      priority: report.nominationFile.priorite
        ? prismaPrioriteEnumToPrioriteEnum(report.nominationFile.priorite)
        : null,

      dateTransparence: DateOnly.fromDate(
        report.nominationFile.session.date,
      ).toJson(),
      dueDate:
        DateOnly.fromOptionalDate(
          report.nominationFile.session.dueDate,
        )?.toJson() ?? null,
      formation: prismaFormationEnumToFormationEnum(
        report.nominationFile.session.formation,
      ),
      transparency: report.nominationFile.session.name,
      name: report.nominationFile.name,

      rules: {
        [NominationFile.RuleGroup.MANAGEMENT]: Object.fromEntries(
          Object.values(NominationFile.ManagementRule)
            .map((ruleName) => [ruleName, rulesByRuleName.get(ruleName)])
            .filter(isDefined),
        ),
        [NominationFile.RuleGroup.QUALITATIVE]: Object.fromEntries(
          Object.values(NominationFile.QualitativeRule)
            .map((ruleName) => [ruleName, rulesByRuleName.get(ruleName)])
            .filter(isDefined),
        ),
        [NominationFile.RuleGroup.STATUTORY]: Object.fromEntries(
          Object.values(NominationFile.StatutoryRule)
            .map((ruleName) => [ruleName, rulesByRuleName.get(ruleName)])
            .filter(isDefined),
        ),
      },
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

  private async withUrls<
    F extends { id: string; name: string; path: readonly string[] },
  >(files: readonly F[]): Promise<(F & { url: string })[]> {
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
    name: z.string(),
    comment: z.string().nullable(),
    formation: z.enum(Magistrat.Formation),
    state: z.enum(NominationFile.ReportState),
    folderNumber: z.number().nullable(),
    biography: z.string().nullable(),
    dueDate: dateOnlyJsonSchema.nullable(),
    birthDate: dateOnlyJsonSchema.nullable(),
    transparency: z.string(),
    dateTransparence: dateOnlyJsonSchema,
    grade: z.enum(Magistrat.Grade),
    currentPosition: z.string().nullable(),
    targettedPosition: z.string().nullable(),
    rank: z.string().nullable(),
    observers: z.array(z.string()),
    dureeDuPoste: z.string().nullable(),
    priority: z.enum(PrioriteEnum).nullable(),

    screenshots: z.array(
      z.object({
        usage: z.enum([ReportFileUsage.EMBEDDED_SCREENSHOT]),
        name: z.string(),
        fileId: z.string(),
        url: z.url(),
      }),
    ),

    attachments: z.array(
      z.object({
        usage: z.enum([ReportFileUsage.ATTACHMENT]),
        name: z.string(),
        fileId: z.string(),
      }),
    ),

    rules: z.object({
      [NominationFile.RuleGroup.MANAGEMENT]: z.record(
        z.enum(NominationFile.ManagementRule),
        z.object({ id: z.string(), validated: z.boolean() }),
      ),
      [NominationFile.RuleGroup.QUALITATIVE]: z.record(
        z.enum(NominationFile.QualitativeRule),
        z.object({ id: z.string(), validated: z.boolean() }),
      ),
      [NominationFile.RuleGroup.STATUTORY]: z.record(
        z.enum(NominationFile.StatutoryRule),
        z.object({ id: z.string(), validated: z.boolean() }),
      ),
    }),
  }),
) {}
