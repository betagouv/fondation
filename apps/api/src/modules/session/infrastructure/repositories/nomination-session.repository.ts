import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import { Prisma } from 'src/generated/prisma/client';
import { Clock } from 'src/modules/framework/clock';
import { PrismaService } from 'src/modules/framework/database';
import { Files } from 'src/modules/framework/files';
import { MembersService } from 'src/modules/members';
import { StatutAffectation } from 'src/modules/session/domain/statut-affectation.enum';
import { prismaFormationEnumToFormationEnum } from 'src/modules/shared/mappers/formation.mapper';
import { assertNever } from 'src/utils/assert-never';
import { makeId } from 'src/utils/id';
import { assertIsDefined, isDefined } from 'src/utils/is-defined';

import { PrioriteEnum } from 'shared-models';
import { deleteReportsAfterAffectationPublicationRawQuery } from 'src/generated/prisma/sql';
import {
  NominationFileAlertHidden,
  NominationFileMemberMemoWritten,
  NominationFileOutcomeDefined,
  NominationSession,
  NominationSessionAffectationVersionCreated,
  NominationSessionAffectationVersionPublished,
  NominationSessionAttachmentAdded,
  NominationSessionAttachmentRemoved,
  NominationSessionCreated,
  NominationSessionFileCommentAccessGranted,
  NominationSessionFilePrioritiesUpdated,
  NominationSessionFileReportersAffected,
  NominationSessionFilesCreated,
  NominationSessionFilesObserversUpdated,
  NominationSessionUpdated,
} from '../../domain/nomination-session';
import { AffectationVersionFinder } from '../finders/affectation-version.finder';
import { getAllNominationSessionReportRules } from './nomination-session-report-rules';
import { gradeEnumToSortableTargetedGrade } from './sortable-targeted-grade';

@Injectable()
export class NominationSessionRepository {
  private readonly logger = new Logger(NominationSessionRepository.name);

  constructor(
    private readonly clock: Clock,
    private readonly prisma: PrismaService,
    private readonly members: MembersService,
    private readonly affectationVersionFinder: AffectationVersionFinder,
    private readonly files: Files,
  ) {}

  async find(
    id: string,
    options: { memberIds?: readonly string[] } = {},
  ): Promise<NominationSession> {
    return this.prisma.$transaction(async (tx) => {
      const session = await tx.session.findUnique({
        where: { id },
        select: {
          id: true,
          formation: true,
          dossierDeNominations: {
            select: { id: true },
            where: { outcome: { not: null } },
          },
        },
      });

      if (!session) throw new NotFoundException();

      const optionalVersion = await this.affectationVersionFinder.last({
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
        nominationFileIdsWithOutcome: new Set(
          session.dossierDeNominations.map(({ id }) => id),
        ),
        version: optionalVersion.map(({ id, status, version }) => ({
          id,
          version,
          isDraft: status === StatutAffectation.BROUILLON,
        })),
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
        } else if (message instanceof NominationSessionFilePrioritiesUpdated) {
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
        } else if (message instanceof NominationSessionFilesObserversUpdated) {
          await this.persistNominationSessionFilesObserversUpdated(tx, message);
        } else if (message instanceof NominationSessionAttachmentAdded) {
          await this.persistNominationSessionAttachmentAdded(tx, message);
        } else if (message instanceof NominationSessionAttachmentRemoved) {
          await this.persistNominationSessionAttachmentRemoved(tx, message);
        } else if (message instanceof NominationSessionUpdated) {
          await this.persistNominationSessionUpdated(tx, message);
        } else if (message instanceof NominationFileOutcomeDefined) {
          await this.persistNominationFileOutcomeDefined(tx, message);
        } else if (message instanceof NominationFileMemberMemoWritten) {
          await this.persistNominationFileMemberMemoWritten(tx, message);
        } else if (message instanceof NominationFileAlertHidden) {
          await this.persistNominationFileAlertHidden(tx, message);
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
      const nominationFileIds = Array.from(
        new Set(
          message.affectations.map(({ nominationFileId }) => nominationFileId),
        ),
      );

      await tx.nominationFileToReporter.deleteMany({
        where: {
          versionId,
          nominationFileId: { in: nominationFileIds },
        },
      });

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
    } else {
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
    }
  }

  private persistNominationSessionFilesPriorityUpdated(
    tx: Prisma.TransactionClient,
    message: NominationSessionFilePrioritiesUpdated,
  ) {
    return tx.dossierDeNomination.update({
      where: { id: message.nominationFileId, sessionId: message.sessionId },
      data: { priorities: message.priorities as PrioriteEnum[] },
    });
  }

  private async persistNominationSessionAffectionVersionPublished(
    tx: Prisma.TransactionClient,
    message: NominationSessionAffectationVersionPublished,
  ) {
    const session = await tx.session.findUnique({
      where: { id: message.sessionId },
      select: {
        // TODO: remove once report.formation is removed
        formation: true,

        id: true,
        affectationVersions: {
          where: { id: message.versionId },
          select: {
            affectations: {
              select: { nominationFileId: true, userId: true },
            },
          },
        },
      },
    });

    if (!session) {
      this.logger.error(
        `tried assigning reports to unknown session "${message.sessionId}"`,
      );
      throw new InternalServerErrorException();
    }

    const { id: versionId } = await tx.affectationVersion.upsert({
      select: { id: true },
      where: { id: message.versionId },
      update: {
        statut: 'PUBLIEE',
        auteurPublicationId: message.userId,
        datePublication: this.clock.now(),
      },
      create: {
        statut: 'PUBLIEE',
        auteurPublicationId: message.userId,
        datePublication: this.clock.now(),
        sessionId: message.sessionId,
      },
    });

    const reportsToCreate = session.affectationVersions.flatMap(
      ({ affectations }) =>
        affectations.map(
          ({ nominationFileId, userId }) =>
            ({
              id: makeId('ReportId'),
              nominationFileId,
              reporterId: userId,
              sessionId: session.id,
              /** @deprecated */
              formation: session.formation,
            }) satisfies Prisma.ReportCreateManyInput,
        ),
    );

    for (const reportToCreate of reportsToCreate) {
      const [existingReport] = await tx.report.updateManyAndReturn({
        select: { id: true },
        data: { isDeleted: false },
        where: {
          sessionId: reportToCreate.sessionId,
          reporterId: reportToCreate.reporterId,
          nominationFileId: reportToCreate.nominationFileId,
        },
      });

      if (!existingReport) {
        await tx.report.create({
          data: {
            ...reportToCreate,
            reportRules: {
              createMany: { data: getAllNominationSessionReportRules() },
            },
          },
        });
      }
    }

    if (!versionId) return;
    await tx.$queryRawTyped(
      deleteReportsAfterAffectationPublicationRawQuery(
        message.sessionId,
        versionId,
      ),
    );
  }

  private async persistNominationSessionAffectationVersionCreated(
    tx: Prisma.TransactionClient,
    message: NominationSessionAffectationVersionCreated,
  ) {
    let previousVersion: {
      id: string;
      affectations: { nominationFileId: string; userId: string }[];
    } | null = null;

    if (message.version.version > 1) {
      previousVersion = await tx.affectationVersion.findUnique({
        select: {
          id: true,
          affectations: { select: { nominationFileId: true, userId: true } },
        },
        where: {
          sessionId_version: {
            sessionId: message.sessionId,
            version: message.version.version - 1,
          },
        },
      });
    }

    await tx.session.update({
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

    if (previousVersion) {
      await tx.nominationFileToReporter.createMany({
        data: previousVersion.affectations.map(
          ({ nominationFileId, userId }) => ({
            versionId: message.version.id,
            nominationFileId,
            userId,
          }),
        ),
      });
    }
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
    const session = await tx.session.findUnique({
      where: { id: message.sessionId },
      select: { dueDate: true },
    });
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
            targetedGrade: f.targetedGrade,
            careerInformation: f.careerInformation,
            dueDate: assertIsDefined(session).dueDate,

            /** virtual field for sorting */
            sortableTargetedGrade: gradeEnumToSortableTargetedGrade(
              f.targetedGrade,
            ),

            /** @deprecated */
            dossierDeNominationImportId: randomUUID(),
            /** @deprecated */
            content: {},
          }) satisfies Prisma.DossierDeNominationCreateManyInput,
      ),
    });
  }

  private async persistNominationSessionFilesObserversUpdated(
    tx: Prisma.TransactionClient,
    message: NominationSessionFilesObserversUpdated,
  ) {
    for (const x of message.nominationFileObservers) {
      await tx.dossierDeNomination.update({
        data: { observers: x.observers as string[] },
        where: { id: x.id },
      });
    }
  }

  private async persistNominationSessionAttachmentAdded(
    tx: Prisma.TransactionClient,
    message: NominationSessionAttachmentAdded,
  ) {
    await tx.sessionAttachment.create({
      data: { sessionId: message.sessionId, fileId: message.file.id },
    });
  }

  private async persistNominationSessionAttachmentRemoved(
    tx: Prisma.TransactionClient,
    message: NominationSessionAttachmentRemoved,
  ) {
    const attachment = await tx.sessionAttachment.findFirst({
      where: { fileId: message.fileId, sessionId: message.sessionId },
      select: { file: { select: { path: true, name: true, id: true } } },
    });

    if (!attachment) return;

    await tx.sessionAttachment.delete({
      where: {
        sessionId_fileId: {
          fileId: message.fileId,
          sessionId: message.sessionId,
        },
      },
    });

    this.files.delete([{ id: attachment.file.id, path: attachment.file.path }]);
  }

  private async persistNominationSessionUpdated(
    tx: Prisma.TransactionClient,
    message: NominationSessionUpdated,
  ) {
    await tx.session.update({
      where: { id: message.sessionId },
      data: {
        name: message.data.name,
        date: message.data.date.toDate(),
        observationsClosingDate: message.data.observationsClosingDate.toDate(),
        dueDate: message.data.dueDate?.toDate() ?? null,
        positionStartDate: message.data.positionStartDate?.toDate() ?? null,
      },
    });
  }

  private async persistNominationFileOutcomeDefined(
    tx: Prisma.TransactionClient,
    message: NominationFileOutcomeDefined,
  ) {
    await tx.dossierDeNomination.update({
      where: { id: message.nominationFileId },
      data: { outcome: message.outcome, outcomeComment: message.comment },
    });
  }

  private async persistNominationFileMemberMemoWritten(
    tx: Prisma.TransactionClient,
    message: NominationFileMemberMemoWritten,
  ) {
    await tx.memberMemo.upsert({
      where: {
        primaryKey: {
          userId: message.userId,
          nominationFileId: message.nominationFileId,
        },
      },

      update: { memo: message.memo },

      create: {
        userId: message.userId,
        nominationFileId: message.nominationFileId,
        memo: message.memo,
      },
    });
  }

  private async persistNominationFileAlertHidden(
    tx: Prisma.TransactionClient,
    message: NominationFileAlertHidden,
  ) {
    await tx.dossierDeNomination.update({
      where: { sessionId: message.sessionId, id: message.nominationFileId },
      data: { alertHidden: true },
    });
  }
}
