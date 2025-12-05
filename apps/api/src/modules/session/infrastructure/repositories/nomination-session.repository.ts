import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import { Prisma } from 'src/generated/prisma/client';
import { Clock } from 'src/modules/framework/clock';
import { PrismaService } from 'src/modules/framework/database';
import { MembersService } from 'src/modules/members';
import { StatutAffectation } from 'src/modules/session/domain/statut-affectation.enum';
import { prismaFormationEnumToFormationEnum } from 'src/modules/shared/mappers/formation.mapper';
import { assertNever } from 'src/utils/assert-never';
import { isDefined } from 'src/utils/is-defined';
import { AffectationVersionFinder } from '../finders/affectation-version.finder';

import {
  NominationSession,
  NominationSessionAffectationVersionCreated,
  NominationSessionAffectationVersionPublished,
  NominationSessionCreated,
  NominationSessionFilePriorityUpdated,
  NominationSessionFileReportersAffected,
  NominationSessionFileCommentAccessGranted,
  NominationSessionFilesCreated,
} from '../../domain/nomination-session';

@Injectable()
export class NominationSessionRepository {
  constructor(
    private readonly clock: Clock,
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
        } else if (message instanceof NominationSessionCreated) {
          await this.persistNominationSessionCreated(tx, message);
        } else if (message instanceof NominationSessionFilesCreated) {
          await this.persistNominationSessionFilesCreated(tx, message);
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
              datePublication: this.clock.now(),
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

  private async persistNominationSessionCreated(
    tx: Prisma.TransactionClient,
    message: NominationSessionCreated,
  ) {
    const existingSession = await tx.session.findFirst({
      where: {
        name: message.name,
        formation: message.formation,
        date: message.date.toDate(),
      },
    });

    if (isDefined(existingSession)) {
      const date = message.date.toDate();
      const [day, month, year] = (
        [date.getDate(), date.getMonth() + 1, date.getFullYear()] as const
      ).map((x) => x.toString().padStart(2, '0'));

      throw new ConflictException(
        `La session "T ${day}/${month}/${year} - ${message.name}" existe déjà`,
      );
    }

    await tx.session.create({
      data: {
        id: message.sessionId,
        name: message.name,
        typeDeSaisine: message.typeDeSaisine,
        formation: message.formation,
        date: message.date.toDate(),
        observationsClosingDate: message.observationClosingDate.toDate(),
        dueDate: message.dueDate?.toDate() ?? null,
        positionStartDate: message.positionStartDate?.toDate() ?? null,

        /** @deprecated */
        sessionImportId: randomUUID(),
      },
    });
  }

  private async persistNominationSessionFilesCreated(
    tx: Prisma.TransactionClient,
    message: NominationSessionFilesCreated,
  ) {
    await tx.dossierDeNomination.createMany({
      data: message.files.map(
        (f) =>
          ({
            id: f.id,
            name: f.name,
            number: f.fileNumber,
            sessionId: message.sessionId,
            biography: f.biography,
            birthDate: f.birthDate?.toDate(),
            currentPosition: f.currentPosition,
            grade: f.grade,
            lastPositionDate: f.lastPositionDate?.toDate(),
            lastRankingDate: f.lastRankingDate?.toDate(),
            observers: f.observers,
            rank: f.rank,
            targetedPosition: f.targetedPosition,
            careerInformation: f.careerInformation,

            /** @deprecated */
            dossierDeNominationImportId: randomUUID(),
            /** @deprecated */
            content: {},
          }) satisfies Prisma.DossierDeNominationCreateManyInput,
      ),
    });
  }
}
