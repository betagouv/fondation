import { Injectable, NotFoundException } from '@nestjs/common';

import { DateOnlyJson, Magistrat, Role, TypeDeSaisine } from 'shared-models';

import { PrismaService } from 'src/modules/framework/database';
import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';
import { assertIsDefined } from 'src/utils/is-defined';
import { AffectationVersionFinder } from '../finders/affectation-version.finder';

@Injectable()
export class DetailSessionQuery {
  constructor(
    private readonly prisma: PrismaService,
    private versionFinder: AffectationVersionFinder,
  ) {}

  async handle(query: {
    userId: string;
    sessionId: string;
    typeDeSaisine: TypeDeSaisine;
  }): Promise<DetailedSessionResponse> {
    const session = await this.prisma.$transaction(async (tx) => {
      const { role } = assertIsDefined(
        await tx.user.findFirst({
          where: { id: query.userId },
          select: { role: true },
        }),
      );

      const version = await this.versionFinder.lastPublished({
        sessionId: query.sessionId,
        tx,
      });

      if (!version) throw new NotFoundException();

      const formation =
        role === Role.MEMBRE_DU_PARQUET
          ? Magistrat.Formation.PARQUET
          : role === Role.MEMBRE_DU_SIEGE
            ? Magistrat.Formation.SIEGE
            : undefined;

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
          dossierDeNominations: {
            where: {
              reporterIds: {
                some: { versionId: version.id, userId: query.userId },
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
              reports: {
                take: 1,
                select: { id: true, state: true },
                where: { reporterId: query.userId },
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
        },
        reports: session.dossierDeNominations.map((d) => {
          const { id, state } = assertIsDefined(d.reports[0]);

          return {
            id,
            state,
            formation: session.formation,
            folderNumber: d.number,
            dueDate: null,
            name: d.name ?? '',
            grade: d.grade ?? '',
            targettedPosition: d.targetedPosition ?? '',
            observersCount: d.observers?.length ?? 0,
          };
        }),
      },
    };
  }
}

export type DetailedSessionResponse = {
  data: {
    session: {
      id: string;
      sessionImportId: string;
      formation: string;
      transparency: string;
      dateTransparence: DateOnlyJson;
    };
    reports: {
      id: string;
      state: string;
      formation: string;
      folderNumber: number | null;
      dueDate: DateOnlyJson | null;
      name: string;
      grade: string;
      targettedPosition: string;
      observersCount: number;
    }[];
  };
};
