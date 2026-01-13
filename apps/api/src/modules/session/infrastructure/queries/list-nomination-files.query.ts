import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import {
  dateOnlyJsonSchema,
  Magistrat,
  PrioriteEnum,
  Role,
} from 'shared-models';

import { PrismaService } from 'src/modules/framework/database';
import {
  prioriteEnumToPrismaPrioriteEnum,
  prismaPrioriteEnumToPrioriteEnum,
} from 'src/modules/shared/mappers/priorite.mapper';
import { DateOnly } from 'src/utils/date-only';
import { AffectationVersionFinder } from '../finders/affectation-version.finder';
import {
  NominationFileOutcome,
  NominationFileOutcomeEnum,
} from '../../domain/nomination-file-outcome';

@Injectable()
export class ListNominationFilesQuery {
  constructor(
    private readonly prisma: PrismaService,
    private readonly versionFinder: AffectationVersionFinder,
  ) {}

  // TODO: paginate, sort, filter...
  async handle(query: {
    sessionId: string;
    user: { id: string; role: Role };
    filters: {
      reporterIds: readonly string[];
      priorities: readonly PrioriteEnum[];
    };
  }): Promise<ListedNominationFileAffectationItem> {
    const isSG = query.user.role === Role.ADJOINT_SECRETAIRE_GENERAL;

    const files = await this.prisma.$transaction(async (tx) => {
      const lastVersion = await this.versionFinder.last({
        tx,
        sessionId: query.sessionId,
      });

      return tx.dossierDeNomination.findMany({
        orderBy: { number: 'asc' },
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
          targetedGrade: true,
          dueDate: true,
          outcome: true,
          outcomeComment: true,
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
          _count: {
            select: { observations: true },
          },
          observations: {
            select: {
              magistrat: {
                select: { id: true, firstName: true, lastName: true },
              },
            },
          },
          memberMemos: {
            where: { userId: query.user.id },
            select: { memo: true },
          },
        },
      });
    });

    const items = files.map((x): NominationFileAffectationItem => {
      const commentAccessUserIds = x.commentAccess.map(({ userId }) => userId);
      const canReadComment =
        isSG || commentAccessUserIds.includes(query.user.id);

      return {
        id: x.id,
        content: {
          version: 2,
          numeroDeDossier: x.number,
          nomMagistrat: x.name,
          grade: x.grade as Magistrat.Grade,
          posteActuel: x.currentPosition,
          posteCible: x.targetedPosition,
          gradeCible: x.targetedGrade as Magistrat.Grade,
          rang: x.rank,
          historique: x.biography,
          observants: x.observers,
          dateDeNaissance:
            DateOnly.fromOptionalDate(x.birthDate)?.toJson() ?? null,
          dateEchéance: DateOnly.fromOptionalDate(x.dueDate)?.toJson() ?? null,
          datePassageAuGrade:
            DateOnly.fromOptionalDate(x.lastRankingDate)?.toJson() ?? null,
          datePriseDeFonctionPosteActuel:
            DateOnly.fromOptionalDate(x.lastPositionDate)?.toJson() ?? null,
          informationCarrière: null,
          outcome: x.outcome
            ? {
                comment: x.outcomeComment,
                value: x.outcome as NominationFileOutcomeEnum,
              }
            : null,
        },
        priority: x.priorite
          ? prismaPrioriteEnumToPrioriteEnum(x.priorite)
          : null,
        comment: canReadComment ? x.comment : null,
        commentAccessUserIds: isSG ? commentAccessUserIds : undefined,
        reporters: x.reporterIds.map(
          ({ user: { id, firstName, lastName } }) => ({
            id,
            firstName,
            lastName,
          }),
        ),
        observationCount: x._count.observations,
        observationMagistrats: [
          ...new Map(
            x.observations
              .filter((obs) => obs.magistrat)
              .map((obs) => [
                obs.magistrat!.id,
                {
                  id: obs.magistrat!.id,
                  firstName: obs.magistrat!.firstName,
                  lastName: obs.magistrat!.lastName,
                },
              ]),
          ).values(),
        ],
        memo: x.memberMemos.at(0)?.memo || null,
      };
    });

    return { items };
  }
}

const NominationFileContentSchema = z.object({
  // open api generator does not support z.literal (json schema const)
  version: z
    .number()
    .min(2)
    .max(2)
    .meta({ example: 2, description: 'always 2' }),
  nomMagistrat: z.string(),
  numeroDeDossier: z.number().nullable(),
  dateEchéance: dateOnlyJsonSchema.nullable(),
  grade: z.enum(Magistrat.Grade).nullable(),
  posteActuel: z.string().nullable(),
  posteCible: z.string().nullable(),
  gradeCible: z.enum(Magistrat.Grade),
  rang: z.string().nullable(),
  dateDeNaissance: dateOnlyJsonSchema.nullable(),
  historique: z.string().nullable(),
  observants: z.array(z.string()).nullable(),
  datePassageAuGrade: dateOnlyJsonSchema.nullable(),
  datePriseDeFonctionPosteActuel: dateOnlyJsonSchema.nullable(),
  informationCarrière: z.string().nullable(),
  outcome: z
    .object({
      value: z.enum(NominationFileOutcome.enum),
      comment: z.string().nullable(),
    })
    .nullable(),
});

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
  observationCount: z.number(),
  observationMagistrats: z.array(
    z.object({
      id: z.string(),
      firstName: z.string(),
      lastName: z.string(),
    }),
  ),
  memo: z.string().nullable(),
});

type NominationFileAffectationItem = z.infer<
  typeof NominationFileAffectationItemSchema
>;

export class ListedNominationFileAffectationItem extends createZodDto(
  z.object({ items: z.array(NominationFileAffectationItemSchema) }),
) {}
