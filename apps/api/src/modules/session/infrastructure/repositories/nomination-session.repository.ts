import { randomUUID } from 'node:crypto';

import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { Magistrat, PrioriteEnum } from 'shared-models';

import {
  LodamNominationSessionFilesCreated,
  NominationFileAlertHidden,
  NominationFileMemberMemoWritten,
  NominationFileOutcomeDefined,
  NominationFilesAssociated,
  NominationSession,
  NominationSessionAffectationVersionCreated,
  NominationSessionAffectationVersionPublished,
  NominationSessionArchived,
  NominationSessionAttachmentAdded,
  NominationSessionAttachmentRemoved,
  NominationSessionCreated,
  NominationSessionDeleted,
  NominationSessionFilePrioritiesUpdated,
  NominationSessionFileReportersAffected,
  NominationSessionFilesObserversUpdated,
  NominationSessionIsArchived,
  NominationSessionUpdated,
  NominationSessionValidated,
} from '../../domain/nomination-session';
import { AffectationVersionFinder } from '../finders/affectation-version.finder';
import { NominationSessionFileFinder } from '../finders/nomination-session-file.finder';
import { Prisma } from 'src/generated/prisma/client';
import {
  deleteReportsAfterAffectationPublicationRawQuery,
  insertLodamNominationFilesRawQuery,
} from 'src/generated/prisma/sql';
import { Clock } from 'src/modules/framework/clock';
import { PrismaService } from 'src/modules/framework/database';
import { Files } from 'src/modules/framework/files';
import { StatutAffectation } from 'src/modules/session/domain/statut-affectation.enum';
import { prismaFormationEnumToFormationEnum } from 'src/modules/shared/mappers/formation.mapper';
import { assertNever } from 'src/utils/assert-never';
import { makeId } from 'src/utils/id';
import { isDefined } from 'src/utils/is-defined';

import { getAllNominationSessionReportRules } from './nomination-session-report-rules';
import { gradeEnumToSortableTargetedGrade } from './sortable-targeted-grade';

@Injectable()
export class NominationSessionRepository {
  private readonly logger = new Logger(NominationSessionRepository.name);

  constructor(
    private readonly clock: Clock,
    private readonly prisma: PrismaService,
    private readonly affectationVersionFinder: AffectationVersionFinder,
    private readonly files: Files,
    private readonly nominationSessionFileFinder: NominationSessionFileFinder,
  ) {}

  async find(
    id: string,
    options: {
      tx?: Prisma.TransactionClient;
      nominationFileIds?: Set<string>;
    } = {},
  ): Promise<NominationSession> {
    if (!options.tx) {
      return this.prisma.$transaction((tx) => this.find(id, { ...options, tx }));
    }

    const { tx } = options;

    const session = await tx.session.findUnique({
      where: { id, deletedAt: null },
      select: {
        id: true,
        formation: true,
        archivedAt: true,
      },
    });

    if (!session) throw new NotFoundException();
    if (session.archivedAt) throw new NominationSessionIsArchived(id);

    const nominationFiles = await this.nominationSessionFileFinder.findUpdatable({
      tx,
      sessionId: session.id,
      nominationFileIds: options.nominationFileIds,
    });

    const optionalVersion = await this.affectationVersionFinder.last({
      tx,
      sessionId: id,
    });

    return NominationSession.from({
      id,
      nominationFiles,
      formation: prismaFormationEnumToFormationEnum(session.formation),
      version: optionalVersion.map(({ id, status, version }) => ({
        id,
        version,
        isDraft: status === StatutAffectation.BROUILLON,
      })),
    });
  }

  async findByLolfiSessionId(lolfiSessionId: number): Promise<{
    [K in Magistrat.Formation]?: { isArchived: false; session: NominationSession } | { isArchived: true };
  }> {
    return this.prisma.$transaction(async (tx) => {
      const ids = await tx.session.findMany({
        select: { id: true, archivedAt: true, formation: true },
        where: { lolfiSessionId },
      });

      if (ids.length > 2) {
        this.logger.error(`More than 2 sessions found for lolfiSessionId: ${lolfiSessionId}`);

        throw new InternalServerErrorException();
      }

      if (ids.length === 0) return {};

      const entries = await Promise.all(
        ids.map(async ({ id, archivedAt, formation }) => {
          if (archivedAt) return [formation, { isArchived: true }] as const;

          const session = await this.find(id, { tx });
          return [formation, { session, isArchived: false }] as const;
        }),
      );

      return Object.fromEntries(entries);
    });
  }

  async persist(session: NominationSession, tx?: Prisma.TransactionClient): Promise<void> {
    if (!tx) return this.prisma.$transaction((tx) => this.persist(session, tx));

    for (const message of session.messages) {
      if (message instanceof NominationSessionFileReportersAffected) {
        await this.persistAffectedReportersToNominationSessionFile(tx, message);
      } else if (message instanceof NominationSessionFilePrioritiesUpdated) {
        await this.persistNominationSessionFilesPriorityUpdated(tx, message);
      } else if (message instanceof NominationSessionAffectationVersionPublished) {
        await this.persistNominationSessionAffectionVersionPublished(tx, message);
      } else if (message instanceof NominationSessionAffectationVersionCreated) {
        await this.persistNominationSessionAffectationVersionCreated(tx, message);
      } else if (message instanceof NominationSessionCreated) {
        await this.persistNominationSessionCreated(tx, message);
      } else if (message instanceof LodamNominationSessionFilesCreated) {
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
      } else if (message instanceof NominationFilesAssociated) {
        await this.persistNominationFilesAssociated(tx, message);
      } else if (message instanceof NominationSessionValidated) {
        await this.persistNominationSessionValidated(tx, message);
      } else if (message instanceof NominationSessionDeleted) {
        await this.persistNominationSessionDeleted(tx, message);
      } else if (message instanceof NominationSessionArchived) {
        await this.persistNominationSessionArchived(tx, message);
      } else {
        assertNever(message);
      }
    }
  }

  private async persistAffectedReportersToNominationSessionFile(
    tx: Prisma.TransactionClient,
    message: NominationSessionFileReportersAffected,
  ) {
    const { versionId } = message;
    if (versionId) {
      const nominationFileIds = Array.from(
        new Set(message.affectations.map(({ nominationFileId }) => nominationFileId)),
      );

      await tx.nominationFileToReporter.deleteMany({
        where: {
          versionId,
          nominationFileId: { in: nominationFileIds },
        },
      });

      await tx.nominationFileToReporter.createMany({
        data: message.affectations.flatMap(({ reporterIds, nominationFileId }) =>
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
              data: message.affectations.flatMap(({ reporterIds, nominationFileId }) =>
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
      where: { id: message.sessionId, deletedAt: null },
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
      this.logger.error(`tried assigning reports to unknown session "${message.sessionId}"`);
      throw new InternalServerErrorException();
    }

    let versionId: string;
    // We can't use upsert, since `message.versionId` is nullable. It doesn't appear in prisma TS error but at runtime
    if (message.versionId) {
      const affectationVersion = await tx.affectationVersion.update({
        select: { id: true },
        where: { id: message.versionId },
        data: {
          statut: 'PUBLIEE',
          auteurPublicationId: message.userId,
          datePublication: this.clock.now(),
          sessionId: message.sessionId,
        },
      });
      versionId = affectationVersion.id;
    } else {
      const affectationVersion = await tx.affectationVersion.create({
        select: { id: true },
        data: {
          statut: 'PUBLIEE',
          auteurPublicationId: message.userId,
          datePublication: this.clock.now(),
          sessionId: message.sessionId,
        },
      });
      versionId = affectationVersion.id;
    }

    const reportsToCreate = session.affectationVersions.flatMap(({ affectations }) =>
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
    await tx.$queryRawTyped(deleteReportsAfterAffectationPublicationRawQuery(message.sessionId, versionId));
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
        data: previousVersion.affectations.map(({ nominationFileId, userId }) => ({
          versionId: message.version.id,
          nominationFileId,
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
      const [day, month, year] = ([date.getDate(), date.getMonth() + 1, date.getFullYear()] as const).map(
        (x) => x.toString().padStart(2, '0'),
      );

      throw new ConflictException(`La session "T ${day}/${month}/${year} - ${message.name}" existe déjà`);
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
        lolfiSessionId: message.lolfiSessionId,

        /** @deprecated */
        sessionImportId: randomUUID(),
      },
    });
  }

  private async persistNominationSessionFilesCreated(
    tx: Prisma.TransactionClient,
    message: LodamNominationSessionFilesCreated,
  ) {
    const session = await tx.session.findUnique({
      where: { id: message.sessionId },
      select: { dueDate: true },
    });
    await tx.$queryRawTyped(
      insertLodamNominationFilesRawQuery(
        message.files.map((file) => ({
          ...file,
          birthDate: file.birthDate?.toDate() ?? null,
          lastPositionDate: file.lastPositionDate?.toDate() ?? null,
          lastRankingDate: file.lastRankingDate?.toDate() ?? null,
          sortableTargetedGrade: gradeEnumToSortableTargetedGrade(file.targetedGrade),
        })),
        message.sessionId,
        session?.dueDate ?? null,
      ),
    );
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

  private async persistNominationFilesAssociated(
    tx: Prisma.TransactionClient,
    message: NominationFilesAssociated,
  ) {
    const session = await tx.session.findFirst({
      where: { id: message.sessionId },
      select: { dueDate: true },
    });

    if (!session) {
      this.logger.error(`Tried reading due date from unknown session: ${message.sessionId}`);
      throw new InternalServerErrorException();
    }

    for (const file of message.files) {
      await tx.dossierDeNomination.upsert({
        where: {
          sessionFileNumber: {
            sessionId: message.sessionId,
            number: file.fileNumber,
          },
        },
        create: {
          id: file.id,
          number: file.fileNumber,
          sessionId: message.sessionId,

          biography: file.biography,
          birthDate: file.birthDate?.toDate(),
          currentPosition: file.currentPosition,
          detectedJurisdictionId: file.detectedJurisdictionId,
          detectedMagistratId: file.detectedMagistratId,
          detectedTargetedFunctionId: file.detectedTargetedFunctionId,
          detectedTargetedPositionId: file.detectedTargetedPositionId,
          dueDate: session.dueDate,
          grade: file.grade,
          lastPositionDate: file.lastPositionDate?.toDate(),
          lastRankingDate: file.lastRankingDate?.toDate(),
          name: file.name,
          rank: file.rank,
          sortableTargetedGrade: file.sortableTargetedGrade,
          targetedGrade: file.targetedGrade,
          targetedPosition: file.targetedPosition,
        },
        update: {
          biography: file.biography,
          birthDate: file.birthDate?.toDate(),
          currentPosition: file.currentPosition,
          detectedJurisdictionId: file.detectedJurisdictionId,
          detectedMagistratId: file.detectedMagistratId,
          detectedTargetedFunctionId: file.detectedTargetedFunctionId,
          detectedTargetedPositionId: file.detectedTargetedPositionId,
          dueDate: session.dueDate,
          grade: file.grade,
          lastPositionDate: file.lastPositionDate?.toDate(),
          lastRankingDate: file.lastRankingDate?.toDate(),
          name: file.name,
          rank: file.rank,
          sortableTargetedGrade: file.sortableTargetedGrade,
          targetedGrade: file.targetedGrade,
          targetedPosition: file.targetedPosition,
        },
      });
    }
  }

  private async persistNominationSessionValidated(
    tx: Prisma.TransactionClient,
    message: NominationSessionValidated,
  ) {
    await tx.session.update({
      where: { id: message.sessionId },
      data: {
        isValidated: true,
        validatedBy: message.userId,
        validatedAt: this.clock.now(),
      },
    });
  }

  private async persistNominationSessionDeleted(
    tx: Prisma.TransactionClient,
    message: NominationSessionDeleted,
  ) {
    await tx.session.update({
      where: { id: message.id },
      data: { deletedAt: this.clock.now(), deletedBy: message.userId },
    });
  }

  private async persistNominationSessionArchived(
    tx: Prisma.TransactionClient,
    message: NominationSessionArchived,
  ) {
    await tx.session.update({
      where: { id: message.sessionId },
      data: { archivedAt: this.clock.now(), archivedBy: message.userId },
    });
  }
}
