import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { PrioriteEnum, Role } from 'shared-models';

import { PrismaService } from 'src/modules/framework/database';
import { NominationFileContentSchema } from 'src/modules/session/infrastructure/nomination-file-content.schema';
import {
  prioriteEnumToPrismaPrioriteEnum,
  prismaPrioriteEnumToPrioriteEnum,
} from 'src/modules/shared/mappers/priorite.mapper';
import { AffectationVersionFinder } from '../finders/affectation-version.finder';
import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';

@Injectable()
export class ListNominationFilesQuery {
  constructor(
    private readonly prisma: PrismaService,
    private readonly versionFinder: AffectationVersionFinder,
  ) {}

  // TODO: paginate, sort, filter...
  async handle(query: {
    sessionId: string;
    userId: string;
    userRole: Role;
    filters: {
      reporterIds: readonly string[];
      priorities: readonly PrioriteEnum[];
    };
  }): Promise<{ items: NominationFileAffectationItem[] }> {
    const isSG = query.userRole === Role.ADJOINT_SECRETAIRE_GENERAL;

    const files = await this.prisma.$transaction(async (tx) => {
      const lastVersion = await this.versionFinder.last({
        tx,
        sessionId: query.sessionId,
      });

      return tx.dossierDeNomination.findMany({
        where: {
          sessionId: query.sessionId,
          priorite: {
            in:
              query.filters.priorities.length > 0
                ? query.filters.priorities.map(prioriteEnumToPrismaPrioriteEnum)
                : undefined,
          },
          reporterIds:
            query.filters.reporterIds.length > 0
              ? {
                  some: {
                    versionId: lastVersion?.id,
                    userId: { in: query.filters.reporterIds as string[] },
                  },
                }
              : undefined,
        },
        select: {
          id: true,
          priorite: true,
          comment: true,
          biography: true,
          birthDate: true,
          currentPosition: true,
          grade: true,
          lastPositionDate: true,
          lastRankingDate: true,
          name: true,
          number: true,
          observers: true,
          rank: true,
          targetedPosition: true,
          commentAccess: {
            select: { userId: true },
          },
          reporterIds: {
            where: { versionId: lastVersion?.id },
            include: {
              user: {
                select: { id: true, firstName: true, lastName: true },
              },
            },
          },
        },
      });
    });

    const partialItems = files.map((x) => {
      const commentAccessUserIds = x.commentAccess.map((a) => a.userId);
      const hasCommentAccess =
        isSG || commentAccessUserIds.includes(query.userId);

      return {
        id: x.id,
        content: {
          version: 2,
          numeroDeDossier: x.number,
          nomMagistrat: x.name,
          dateEchéance: null,
          grade: x.grade,
          posteActuel: x.currentPosition,
          posteCible: x.targetedPosition,
          rang: x.rank,
          dateDeNaissance: x.birthDate
            ? DateOnly.fromDate(x.birthDate).toJson()
            : null,
          historique: x.biography,
          observants: x.observers,
          datePassageAuGrade: x.lastRankingDate
            ? DateOnly.fromDate(x.lastRankingDate).toJson()
            : null,
          datePriseDeFonctionPosteActuel: x.lastPositionDate
            ? DateOnly.fromDate(x.lastPositionDate).toJson()
            : null,
          informationCarrière: null,
        },
        priority: x.priorite
          ? prismaPrioriteEnumToPrioriteEnum(x.priorite)
          : null,
        comment: hasCommentAccess ? x.comment : null,
        commentAccessUserIds: isSG ? commentAccessUserIds : undefined,
        reporters: x.reporterIds.map(
          ({ user: { id, firstName, lastName } }) => ({
            id,
            firstName,
            lastName,
          }),
        ),
      };
    });

    const items = await z
      .array(NominationFileAffectationItemSchema)
      .parseAsync(partialItems);

    return { items };
  }
}

const NominationFileAffectationItemSchema = z.object({
  id: z.string(),
  priority: z.enum(PrioriteEnum).nullable(),
  content: NominationFileContentSchema,
  comment: z.string().nullable(),
  commentAccessUserIds: z.array(z.string()).optional(),
  reporters: z.array(
    z.object({
      id: z.string(),
      firstName: z.string(),
      lastName: z.string(),
    }),
  ),
});

export class NominationFileAffectationItem extends createZodDto(
  NominationFileAffectationItemSchema,
) {}
