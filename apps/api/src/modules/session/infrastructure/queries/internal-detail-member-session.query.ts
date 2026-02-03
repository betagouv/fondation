import { Injectable, NotFoundException } from '@nestjs/common';

import {
  dateOnlyJsonSchema,
  PrioriteEnum,
  Role,
  TypeDeSaisine,
} from 'shared-models';

import { PrismaService } from 'src/modules/framework/database';
import { DateOnly } from 'src/utils/date-only';
import { assertIsDefined } from 'src/utils/is-defined';
import { AffectationVersionFinder } from '../finders/affectation-version.finder';
import { roleToFormation } from 'src/modules/members/infrastructure/member.utils';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';
import { prismaPrioriteEnumToPrioriteEnum } from 'src/modules/shared/mappers/priorite.mapper';

@Injectable()
export class InternalDetailMemberSessionQuery {
  constructor(
    private readonly prisma: PrismaService,
    private versionFinder: AffectationVersionFinder,
  ) {}

  async handle(query: {
    user: { id: string; role: Role };
    sessionId: string;
    typeDeSaisine: TypeDeSaisine;
  }): Promise<DetailedMemberSessionDto> {
    const session = await this.prisma.$transaction(async (tx) => {
      const version = await this.versionFinder
        .lastPublished({
          sessionId: query.sessionId,
          tx,
        })
        .then((v) => v.getNullable());

      if (!version) throw new NotFoundException();

      const formation = roleToFormation(query.user.role);
      return tx.session.findFirst({
        where: {
          formation,
          id: query.sessionId,
          typeDeSaisine: query.typeDeSaisine,
        },
        select: {
          id: true,
          name: true,
          typeDeSaisine: true,
          formation: true,
          sessionImportId: true,
          date: true,
          dueDate: true,
          dossierDeNominations: {
            where: {
              reporterIds: {
                some: { versionId: version.id, userId: query.user.id },
              },
            },
            select: {
              id: true,
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
              priorite: true,
              reports: {
                take: 1,
                select: { id: true, state: true },
                where: { reporterId: query.user.id },
              },
              observations: {
                select: {
                  id: true,
                  magistrat: {
                    select: { id: true, firstName: true, lastName: true },
                  },
                },
              },
            },
          },
        },
      });
    });

    if (!session) throw new NotFoundException();

    return {
      data: {
        session: {
          id: session.id,
          sessionImportId: session.sessionImportId,
          formation: session.formation,
          transparency: session.name,
          dateTransparence: DateOnly.fromDate(session.date).toJson(),
          dateSeance:
            DateOnly.fromOptionalDate(session.dueDate)?.toJson() ?? null,
        },
        reports: session.dossierDeNominations.map((d) => {
          const { id, state } = assertIsDefined(d.reports[0]);

          return {
            id,
            nominationFileId: d.id,
            state,
            formation: session.formation,
            folderNumber: d.number,
            dueDate: null,
            name: d.name ?? '',
            grade: d.grade ?? '',
            targettedPosition: d.targetedPosition ?? '',
            filePriority: d.priorite
              ? prismaPrioriteEnumToPrioriteEnum(d.priorite)
              : null,
            observers: d.observers,
            observationMagistrats: d.observations
              .filter((obs) => obs.magistrat)
              .map((obs) => ({
                id: obs.magistrat!.id,
                firstName: obs.magistrat!.firstName,
                lastName: obs.magistrat!.lastName,
                observationId: obs.id,
              })),
          };
        }),
      },
    };
  }
}

export class DetailedMemberSessionDto extends createZodDto(
  z.object({
    data: z.object({
      session: z.object({
        id: z.string(),
        sessionImportId: z.string(),
        formation: z.string(),
        transparency: z.string(),
        dateTransparence: dateOnlyJsonSchema,
        dateSeance: dateOnlyJsonSchema.nullable(),
      }),
      reports: z.array(
        z.object({
          id: z.string(),
          nominationFileId: z.string(),
          state: z.string(),
          formation: z.string(),
          folderNumber: z.number().nullable(),
          filePriority: z.enum(PrioriteEnum).nullable(),
          dueDate: dateOnlyJsonSchema.nullable(),
          name: z.string(),
          grade: z.string(),
          targettedPosition: z.string(),
          observers: z.array(z.string()),
          observationMagistrats: z.array(
            z.object({
              id: z.string(),
              firstName: z.string(),
              lastName: z.string(),
              observationId: z.string(),
            }),
          ),
        }),
      ),
    }),
  }),
) {}
