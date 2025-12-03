import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from 'src/modules/framework/database';
import { assertNever } from 'src/utils/assert-never';

import { Prisma, User } from 'src/generated/prisma/client';
import { MembersService } from 'src/modules/members';
import { prismaFormationEnumToFormationEnum } from 'src/modules/shared/mappers/formation.mapper';
import { StatutAffectation } from 'src/modules/session/domain/statut-affectation.enum';
import {
  NominationSession,
  NominationSessionAffectationVersionCreated,
  NominationSessionAffectationVersionPublished,
  NominationSessionFilePriorityUpdated,
  NominationSessionFileReportersAffected,
  NominationSessionFileCommentAccessGranted,
} from '../../domain/nomination-session';
import { AffectationVersionFinder } from '../finders/affectation-version.finder';
import { Magistrat } from 'shared-models';
import {
  MEMBER_ROLES,
  memberRoles,
} from 'src/modules/members/infrastructure/member.utils';

@Injectable()
export class NominationSessionRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly members: MembersService,
    private readonly affectationVersionFinder: AffectationVersionFinder,
  ) {}

  async find(
    id: string,
    options: { memberIds?: readonly string[] } = {},
  ): Promise<NominationSession> {
    return this.prisma.$transaction(async (tx) => {
      const session = await tx.session.findUnique({
        where: { id },
        select: { id: true, formation: true },
      });

      if (!session) throw new NotFoundException();

      const version = await this.affectationVersionFinder.last({
        tx,
        sessionId: id,
      });

      const formationMemberIds = await this.members
        .findMembers({
          ids: options.memberIds,
          formation: prismaFormationEnumToFormationEnum(session.formation),
        })
        .then((ids) => new Set(ids));

      return NominationSession.from({
        id,
        formationMemberIds,
        version: version
          ? {
              id: version.id,
              version: version.version,
              isDraft: version.status === StatutAffectation.BROUILLON,
            }
          : null,
      });
    });
  }

  async createWithReporterFullNames(props: {
    reporters: Set<string>;
    formation: Magistrat.Formation;
  }): Promise<NominationSession> {
    const roles = memberRoles(props.formation);
    const reporterFullNames = Array.from(props.reporters).map((x) =>
      x.toLowerCase(),
    );

    // typed sql does not support array --"

    const formationMemberIds = new Set(members.map(({ id }) => id));

    return NominationSession.createNominationTreeAndAffectMembers({});
  }

  persist(session: NominationSession) {
    return this.prisma.$transaction(async (tx) => {
      for (const message of session.messages) {
        if (message instanceof NominationSessionFileReportersAffected) {
          await this.persistAffectedReportersToNominationSessionFile(
            tx,
            message,
          );
        } else if (message instanceof NominationSessionFilePriorityUpdated) {
          await this.persistNominationSessionFilesPriorityUpdated(tx, message);
        } else if (
          message instanceof NominationSessionAffectationVersionPublished
        ) {
          await this.persistNominationSessionAffectionVersionPublished(
            tx,
            message,
          );
        } else if (
          message instanceof NominationSessionAffectationVersionCreated
        ) {
          await this.persistNominationSessionAffectationVersionCreated(
            tx,
            message,
          );
        } else if (
          message instanceof NominationSessionFileCommentAccessGranted
        ) {
          await this.persistNominationSessionFileCommentAccessGranted(
            tx,
            message,
          );
        } else {
          assertNever(message);
        }
      }
    });
  }

  private async persistAffectedReportersToNominationSessionFile(
    tx: Prisma.TransactionClient,
    message: NominationSessionFileReportersAffected,
  ) {
    const { versionId } = message;
    if (versionId) {
      await tx.nominationFileToReporter.deleteMany({
        where: { versionId },
      });
    }

    if (!versionId) {
      await tx.affectationVersion.create({
        data: {
          sessionId: message.sessionId,
          affectations: {
            createMany: {
              data: message.affectations.flatMap(
                ({ reporterIds, nominationFileId }) =>
                  reporterIds.map((userId) => ({
                    userId,
                    nominationFileId,
                  })),
              ),
            },
          },
        },
      });
    } else {
      await tx.nominationFileToReporter.createMany({
        data: message.affectations.flatMap(
          ({ reporterIds, nominationFileId }) =>
            reporterIds.map((userId) => ({
              userId,
              versionId,
              nominationFileId,
            })),
        ),
      });
    }
  }

  private persistNominationSessionFilesPriorityUpdated(
    tx: Prisma.TransactionClient,
    message: NominationSessionFilePriorityUpdated,
  ) {
    return tx.dossierDeNomination.update({
      where: { id: message.nominationFileId, sessionId: message.sessionId },
      data: { priorite: message.priority },
    });
  }

  private persistNominationSessionAffectionVersionPublished(
    tx: Prisma.TransactionClient,
    message: NominationSessionAffectationVersionPublished,
  ) {
    return tx.session.update({
      where: { id: message.sessionId },
      data: {
        affectationVersions: {
          update: {
            where: { id: message.versionId },
            data: {
              statut: 'PUBLIEE',
              auteurPublicationId: message.userId,

              // TODO: replace with clock or DateTimeProvider
              datePublication: new Date(),
            },
          },
        },
      },
    });
  }

  private persistNominationSessionAffectationVersionCreated(
    tx: Prisma.TransactionClient,
    message: NominationSessionAffectationVersionCreated,
  ) {
    return tx.session.update({
      where: { id: message.sessionId },
      data: {
        affectationVersions: {
          create: {
            statut: 'BROUILLON',
            id: message.version.id,
            version: message.version.version,
          },
        },
      },
    });
  }

  private async persistNominationSessionFileCommentAccessGranted(
    tx: Prisma.TransactionClient,
    message: NominationSessionFileCommentAccessGranted,
  ) {
    // Verify the nomination file belongs to the session
    const nominationFile = await tx.dossierDeNomination.findFirst({
      where: {
        id: message.nominationFileId,
        sessionId: message.sessionId,
      },
    });

    if (!nominationFile) {
      throw new NotFoundException(
        `Nomination file ${message.nominationFileId} not found in session ${message.sessionId}`,
      );
    }

    // Delete all existing accesses and create new ones
    await tx.commentAccess.deleteMany({
      where: { nominationFileId: message.nominationFileId },
    });

    if (message.userIds.length > 0) {
      await tx.commentAccess.createMany({
        data: message.userIds.map((userId) => ({
          nominationFileId: message.nominationFileId,
          userId,
        })),
      });
    }
  }
}
