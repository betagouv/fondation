import { Injectable, NotFoundException } from '@nestjs/common';

import { DateOnlyJson, Role, TypeDeSaisine } from 'shared-models';

import { PrismaService } from 'src/modules/framework/database';
import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';
import { assertIsDefined } from 'src/utils/is-defined';
import { AffectationVersionFinder } from '../finders/affectation-version.finder';
import { roleToFormation } from 'src/modules/members/infrastructure/member.utils';

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
      const version = await this.versionFinder.lastPublished({
        sessionId: query.sessionId,
        tx,
      });

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
              reports: {
                take: 1,
                select: { id: true, state: true },
                where: { reporterId: query.user.id },
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

export type DetailedMemberSessionDto = {
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
