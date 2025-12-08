import { Injectable } from '@nestjs/common';

import { PrioriteEnum, TypeDeSaisine } from 'shared-models';
import { PrismaService } from 'src/modules/framework/database';

import { type FoundAffectationVersion } from './finders/affectation-version.finder';
import { AutoAffectationsFinder } from './finders/auto-affectations.finder';
import { DetailNominationSessionAffectationVersionQuery } from './queries/detail-nomination-session-affectation-version.query';
import { DetailSessionQuery } from './queries/detail-session.query';
import { GetNominationFileWithCommentQuery } from './queries/get-nomination-file-with-comment.query';
import {
  ListNominationFilesQuery,
  type NominationFileAffectationItem,
} from './queries/list-nomination-files.query';
import { ListSessionOfTypeGardeDesSceauxQuery } from './queries/list-sessions-of-type-garde-des-sceaux.query';
import { NominationSessionRepository } from './repositories/nomination-session.repository';
import { prismaRoleEnumToRoleEnum } from 'src/modules/shared/mappers/role-enum.mapper';

@Injectable()
export class SessionService {
  constructor(
    private readonly autoAffectationsFinder: AutoAffectationsFinder,
    private readonly detailNominationSessionAffectationVersionQuery: DetailNominationSessionAffectationVersionQuery,
    private readonly detailSessionQuery: DetailSessionQuery,
    private readonly getNominationFileWithCommentQuery: GetNominationFileWithCommentQuery,
    private readonly listNominationFilesQuery: ListNominationFilesQuery,
    private readonly listSessionsOfTypeGardeDesSceauxQuery: ListSessionOfTypeGardeDesSceauxQuery,
    private readonly nominationSessionRepository: NominationSessionRepository,
    private readonly prisma: PrismaService,
  ) {}

  listSessionsOfTypeGardeDesSceaux(userId: string) {
    return this.listSessionsOfTypeGardeDesSceauxQuery.handle({ userId });
  }

  detailSession(query: {
    userId: string;
    sessionId: string;
    typeDeSaisine: TypeDeSaisine;
  }) {
    return this.detailSessionQuery.handle(query);
  }

  async affectReportersAndPriorities(command: {
    sessionId: string;
    affectations: readonly {
      nominationFileId: string;
      priority: PrioriteEnum | null;
      reporterIds: readonly string[];
    }[];
  }): Promise<void> {
    const session = await this.nominationSessionRepository.find(
      command.sessionId,
      {
        memberIds: Array.from(
          new Set(
            command.affectations.flatMap(
              (affectation) => affectation.reporterIds,
            ),
          ),
        ),
      },
    );

    session.affectNominationFileReporters(command.affectations);

    for (const item of command.affectations) {
      session.setNominationFilePriority({
        nominationFileId: item.nominationFileId,
        priority: item.priority,
      });
    }

    await this.nominationSessionRepository.persist(session);
  }

  async listNominationFiles(query: {
    sessionId: string;
    userId: string;
    filters: {
      reporterIds: readonly string[];
      priorities: readonly PrioriteEnum[];
    };
  }): Promise<{ items: NominationFileAffectationItem[] }> {
    const user = await this.prisma.user.findUnique({
      where: { id: query.userId },
      select: { role: true },
    });

    if (!user) {
      throw new Error(`User with id ${query.userId} not found`);
    }

    return this.listNominationFilesQuery.handle({
      ...query,
      userRole: prismaRoleEnumToRoleEnum(user.role),
    });
  }

  detailNominationSessionAffectationsVersion(query: {
    sessionId: string;
  }): Promise<FoundAffectationVersion> {
    return this.detailNominationSessionAffectationVersionQuery.handle(query);
  }

  async publishNominationSessionAffectationsVersion(command: {
    sessionId: string;
    userId: string;
  }): Promise<void> {
    const session = await this.nominationSessionRepository.find(
      command.sessionId,
    );
    session.publishAffectationVersion({ userId: command.userId });
    await this.nominationSessionRepository.persist(session);
  }

  async autoAffectation(command: {
    sessionId: string;
    nominationFileIds: readonly string[];
  }): Promise<void> {
    const session = await this.nominationSessionRepository.find(
      command.sessionId,
    );
    const autoAffectations = await this.autoAffectationsFinder.find({
      sessionId: command.sessionId,
      nominationFileIds: command.nominationFileIds,
    });

    session.autoAffectNominationFileReporters(autoAffectations);

    await this.nominationSessionRepository.persist(session);
  }

  async updateNominationFileComment(command: {
    sessionId: string;
    nominationFileId: string;
    comment: string | null;
  }): Promise<void> {
    await this.prisma.dossierDeNomination.update({
      where: {
        id: command.nominationFileId,
        sessionId: command.sessionId,
      },
      data: { comment: command.comment },
    });
  }

  getCommentAccess(query: {
    sessionId: string;
    nominationFileId: string;
  }): Promise<{ comment: string | null; userIds: string[] }> {
    return this.getNominationFileWithCommentQuery.handle(query);
  }

  async updateCommentAccess(command: {
    sessionId: string;
    nominationFileId: string;
    userIds: readonly string[];
  }): Promise<void> {
    const session = await this.nominationSessionRepository.find(
      command.sessionId,
    );

    session.grantCommentAccess({
      nominationFileId: command.nominationFileId,
      userIds: command.userIds,
    });

    await this.nominationSessionRepository.persist(session);
  }
}
