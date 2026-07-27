import { Injectable, NotFoundException } from '@nestjs/common';
import z from 'zod';

import { PrismaFormationEnum } from 'src/generated/prisma/enums';
import { findReportedSessionIds } from 'src/generated/prisma/sql';
import { PrismaService } from 'src/modules/framework/database';
import { createPaginatedZodDto, paginate, Pagination } from 'src/modules/framework/pagination';
import {
  NominationFileOutcome,
  type NominationFileOutcomeEnum,
} from 'src/modules/session/shared/types/nomination-file-outcome';
import { TransparenceService } from 'src/modules/session/transparence/infrastructure/transparence.service';
import { FormationEnum } from 'src/modules/shared/formation.enum';
import { prismaFormationEnumToFormationEnum } from 'src/modules/shared/mappers/formation.mapper';
import { DateOnly, dateOnlyJsonSchema } from 'src/utils/date-only';
import { dateToTimeOnly, timeOnlySchema } from 'src/utils/time-only';

const SESSION_STATUSES = ['ONGOING', 'REPORTED', 'ARCHIVED'] as const;

@Injectable()
export class ListMagistratNominationFilesQuery {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessions: TransparenceService,
  ) {}

  async handle(query: {
    magistratId: string;
    pagination: Pagination;
  }): Promise<ListedMagistratNominationFilesDto> {
    return this.prisma.$transaction(async (tx) => {
      const magistrat = await tx.magistrat.findUnique({
        where: { id: query.magistratId },
        select: { id: true },
      });
      if (!magistrat) throw new NotFoundException();

      const where = { detectedMagistratId: query.magistratId, session: { deletedAt: null } };
      const totalCount = await tx.dossierDeNomination.count({ where });
      const nominationFiles = await tx.dossierDeNomination.findMany({
        where,
        orderBy: { session: { date: 'desc' } },
        skip: (query.pagination.page - 1) * query.pagination.limit,
        take: query.pagination.limit,
        select: {
          id: true,
          number: true,
          auditionDate: true,
          auditionTime: true,
          targetedGrade: true,
          targetedPosition: true,
          outcome: true,
          outcomeComment: true,
          reporterIds: {
            where: { version: { statut: 'PUBLIEE' } },
            select: {
              versionId: true,
              user: { select: { id: true, firstName: true, lastName: true } },
            },
          },
          session: {
            select: {
              id: true,
              name: true,
              formation: true,
              date: true,
              archivedAt: true,
            },
          },
        },
      });

      const sessionIds = Array.from(new Set(nominationFiles.map(({ session }) => session.id)));
      const reportedSessions = sessionIds.length
        ? await tx.$queryRawTyped(findReportedSessionIds(sessionIds))
        : [];
      const reportedSessionIds = new Set(reportedSessions.map(({ id }) => id));
      const publishedVersionIds = await this.sessions.internalLastPublishedAffectationVersionIds({
        sessionIds,
        tx,
      });

      const items = nominationFiles.map((nominationFile) =>
        this.toFileDto(nominationFile, publishedVersionIds, reportedSessionIds),
      );

      return paginate({ items, totalCount, pagination: query.pagination });
    });
  }

  private toFileDto(
    nominationFile: {
      id: string;
      number: number | null;
      auditionDate: Date | null;
      auditionTime: Date | null;
      targetedGrade: string | null;
      targetedPosition: string | null;
      outcome: NominationFileOutcomeEnum | null;
      outcomeComment: string | null;
      reporterIds: {
        versionId: string;
        user: { id: string; firstName: string; lastName: string };
      }[];
      session: {
        id: string;
        name: string;
        formation: PrismaFormationEnum;
        date: Date;
        archivedAt: Date | null;
      };
    },
    publishedVersionIds: Map<string, string>,
    reportedSessionIds: Set<string>,
  ) {
    const publishedVersionId = publishedVersionIds.get(nominationFile.session.id);
    const reporters = nominationFile.reporterIds
      .filter((reporter) => reporter.versionId === publishedVersionId)
      .map(({ user }) => ({ id: user.id, firstName: user.firstName, lastName: user.lastName }));

    return {
      id: nominationFile.id,
      number: nominationFile.number,
      reporters,
      session: {
        id: nominationFile.session.id,
        name: nominationFile.session.name,
        formation: prismaFormationEnumToFormationEnum(nominationFile.session.formation),
        date: DateOnly.fromDate(nominationFile.session.date).toJson(),
        status: this.sessionStatus(nominationFile.session, reportedSessionIds),
      },
      auditionDate: nominationFile.auditionDate
        ? DateOnly.fromDate(nominationFile.auditionDate).toJson()
        : null,
      auditionTime: nominationFile.auditionTime ? dateToTimeOnly(nominationFile.auditionTime) : null,
      targetedGrade: nominationFile.targetedGrade,
      targetedPosition: nominationFile.targetedPosition,
      outcome: nominationFile.outcome
        ? { value: nominationFile.outcome, comment: nominationFile.outcomeComment }
        : null,
    };
  }

  private sessionStatus(
    session: { id: string; archivedAt: Date | null },
    reportedSessionIds: Set<string>,
  ): (typeof SESSION_STATUSES)[number] {
    if (session.archivedAt) return 'ARCHIVED';
    if (reportedSessionIds.has(session.id)) return 'REPORTED';
    return 'ONGOING';
  }
}

const MagistratNominationFileSchema = z.object({
  id: z.string(),
  number: z.number().int().nullable(),
  reporters: z.array(z.object({ id: z.string(), firstName: z.string(), lastName: z.string() })),
  session: z.object({
    id: z.string(),
    name: z.string(),
    formation: z.enum(FormationEnum),
    date: dateOnlyJsonSchema,
    status: z.enum(SESSION_STATUSES),
  }),
  auditionDate: dateOnlyJsonSchema.nullable(),
  auditionTime: timeOnlySchema.nullable(),
  targetedGrade: z.string().nullable(),
  targetedPosition: z.string().nullable(),
  outcome: z
    .object({
      value: z.enum(NominationFileOutcome.enum),
      comment: z.string().nullable(),
    })
    .nullable(),
});

export class ListedMagistratNominationFilesDto extends createPaginatedZodDto(MagistratNominationFileSchema) {}
