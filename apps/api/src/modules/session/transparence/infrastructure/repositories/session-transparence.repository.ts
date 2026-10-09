import { Propagation, Transactional } from '@nestjs-cls/transactional';
import {
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { AffectationVersionFinder } from '../finders/affectation-version.finder';
import { TransparenceFilesFinder } from '../finders/transparence-files.finder';
import { Prisma } from 'src/generated/prisma/client';
import { insertLodamNominationFilesRawQuery } from 'src/generated/prisma/sql';
import { DocInvalidation } from 'src/modules/docs/shared/domain/invalidation/official-report-invalidated.integration-event';
import { Clock } from 'src/modules/framework/clock';
import { Db } from 'src/modules/framework/database';
import { Files } from 'src/modules/framework/files';
import { ReportService } from 'src/modules/report/report.service';
import {
  LodamSessionTransparenceFilesCreated,
  SessionTransparence,
  SessionTransparenceAffectationVersionCreated,
  SessionTransparenceAffectationVersionPublished,
  SessionTransparenceArchived,
  SessionTransparenceAttachmentAdded,
  SessionTransparenceAttachmentRemoved,
  SessionTransparenceAuditionRequestDefined,
  SessionTransparenceAuditionScheduled,
  SessionTransparenceAuditionsPublished,
  SessionTransparenceAuditionUnScheduled,
  SessionTransparenceCommentWritten,
  SessionTransparenceCreated,
  SessionTransparenceDeleted,
  SessionTransparenceFileAlertHidden,
  SessionTransparenceFileAttachmentAdded,
  SessionTransparenceFileAttachmentRemoved,
  SessionTransparenceFileMemberMemoWritten,
  SessionTransparenceFileMissingEvaluationCommentUpdated,
  SessionTransparenceFileMissingEvaluationUpdated,
  SessionTransparenceFilePrioritiesUpdated,
  SessionTransparenceFileReportersAffected,
  SessionTransparenceFilesObserversUpdated,
  SessionTransparenceIsArchived,
  SessionTransparenceLolfiFilesAssociated,
  SessionTransparenceOutcomeDefined,
  SessionTransparenceUpdated,
  SessionTransparenceValidated,
} from 'src/modules/session/transparence/domain/session-transparence';
import { FormationEnum } from 'src/modules/shared/formation.enum';
import { prismaFormationEnumToFormationEnum } from 'src/modules/shared/mappers/formation.mapper';
import { PriorityEnum } from 'src/modules/shared/priority.enum';
import { assertNever } from 'src/utils/assert-never';
import { DateOnly } from 'src/utils/date-only';
import { makeId } from 'src/utils/id';
import { isDefined } from 'src/utils/is-defined';
import { timeOnlyToDate } from 'src/utils/time-only';

import { gradeEnumToSortableTargetedGrade } from './sortable-targeted-grade';

export type LolfiSessionIngestion =
  | { isIngestable: false; reason: 'ARCHIVED' | 'DELETED' }
  | { isIngestable: true; session: SessionTransparence };

@Injectable()
export class SessionTransparenceRepository {
  private readonly logger = new Logger(SessionTransparenceRepository.name);

  constructor(
    private readonly clock: Clock,
    private readonly db: Db,
    private readonly affectationVersionFinder: AffectationVersionFinder,
    private readonly files: Files,
    private readonly transparenceFilesFinder: TransparenceFilesFinder,
    @Inject(forwardRef(() => ReportService))
    private readonly reports: ReportService,
  ) {}

  @Transactional()
  async find(
    id: string,
    options: {
      nominationFileIds?: Set<string>;
    } = {},
  ): Promise<SessionTransparence> {
    const session = await this.db.tx.session.findUnique({
      select: {
        archivedAt: true,
        formation: true,
        id: true,
        typeDeSaisine: true,
      } satisfies Prisma.SessionSelect,
      where: { deletedAt: null, id },
    });

    if (!session) throw new NotFoundException();
    if (session.archivedAt) throw new SessionTransparenceIsArchived(id);

    // FIXME: remove once we know how to rehydrate a mtt session
    if (session.typeDeSaisine !== 'TRANSPARENCE_GDS') throw new NotFoundException();

    const nominationFiles = await this.transparenceFilesFinder.findSnapshots({
      nominationFileIds: options.nominationFileIds,
      sessionId: session.id,
    });

    const optionalVersion = await this.affectationVersionFinder.last({
      sessionId: id,
    });

    return SessionTransparence.from({
      formation: prismaFormationEnumToFormationEnum(session.formation),
      id,
      nominationFiles,
      version: optionalVersion.map(({ id, status, version }) => ({
        id,
        isDraft: status === 'BROUILLON',
        version,
      })),
    });
  }

  @Transactional()
  async findByLolfiSessionId(lolfiSessionId: number): Promise<{
    [K in FormationEnum]?: LolfiSessionIngestion;
  }> {
    const sessions = await this.db.tx.sessionTransparenceGds.findMany({
      select: {
        session: { select: { archivedAt: true, deletedAt: true, formation: true, id: true } },
      } satisfies Prisma.SessionTransparenceGdsSelect,
      where: { lolfiSessionId },
    });

    if (sessions.length > 2) {
      this.logger.error(`More than 2 sessions found for lolfiSessionId: ${lolfiSessionId}`);

      throw new InternalServerErrorException();
    }

    if (sessions.length === 0) return {};

    const entries = await Promise.all(
      sessions.map(async ({ session: s }) => {
        if (s.deletedAt) return [s.formation, { isIngestable: false, reason: 'DELETED' }] as const;
        if (s.archivedAt) return [s.formation, { isIngestable: false, reason: 'ARCHIVED' }] as const;

        const session = await this.find(s.id);
        return [s.formation, { isIngestable: true, session }] as const;
      }),
    );

    return Object.fromEntries(entries);
  }

  @Transactional(Propagation.Mandatory)
  async persist(session: SessionTransparence): Promise<DocInvalidation[]> {
    const invalidations: DocInvalidation[] = [];

    for (const message of session.messages) {
      if (message instanceof SessionTransparenceFileReportersAffected) {
        await this.persistSessionTransparenceFileReportersAffected(message);
      } else if (message instanceof SessionTransparenceFilePrioritiesUpdated) {
        await this.persistSessionTransparenceFilePrioritiesUpdated(message);
      } else if (message instanceof SessionTransparenceAffectationVersionPublished) {
        invalidations.push(...(await this.persistSessionTransparenceAffectationVersionPublished(message)));
      } else if (message instanceof SessionTransparenceAffectationVersionCreated) {
        await this.persistSessionTransparenceAffectationVersionCreated(message);
      } else if (message instanceof SessionTransparenceCreated) {
        await this.persistSessionTransparenceCreated(message);
      } else if (message instanceof LodamSessionTransparenceFilesCreated) {
        await this.persistLodamSessionTransparenceFilesCreated(message);
      } else if (message instanceof SessionTransparenceFilesObserversUpdated) {
        await this.persistSessionTransparenceFilesObserversUpdated(message);
      } else if (message instanceof SessionTransparenceAttachmentAdded) {
        await this.persistSessionTransparenceAttachmentAdded(message);
      } else if (message instanceof SessionTransparenceAttachmentRemoved) {
        await this.persistSessionTransparenceAttachmentRemoved(message);
      } else if (message instanceof SessionTransparenceFileAttachmentAdded) {
        await this.persistSessionTransparenceFileAttachmentAdded(message);
      } else if (message instanceof SessionTransparenceFileAttachmentRemoved) {
        await this.persistSessionTransparenceFileAttachmentRemoved(message);
      } else if (message instanceof SessionTransparenceUpdated) {
        invalidations.push(...(await this.persistSessionTransparenceUpdated(message)));
      } else if (message instanceof SessionTransparenceCommentWritten) {
        await this.persistSessionTransparenceCommentWritten(message);
      } else if (message instanceof SessionTransparenceOutcomeDefined) {
        invalidations.push(...(await this.persistSessionTransparenceOutcomeDefined(message)));
      } else if (message instanceof SessionTransparenceAuditionRequestDefined) {
        await this.persistSessionTransparenceAuditionRequestDefined(message);
      } else if (message instanceof SessionTransparenceAuditionScheduled) {
        await this.persistSessionTransparenceAuditionScheduled(message);
      } else if (message instanceof SessionTransparenceAuditionsPublished) {
        await this.persistSessionTransparenceAuditionsPublished(message);
      } else if (message instanceof SessionTransparenceAuditionUnScheduled) {
        await this.persistSessionTransparenceAuditionUnScheduled(message);
      } else if (message instanceof SessionTransparenceFileMemberMemoWritten) {
        await this.persistSessionTransparenceFileMemberMemoWritten(message);
      } else if (message instanceof SessionTransparenceFileMissingEvaluationUpdated) {
        await this.persistSessionTransparenceFileMissingEvaluationUpdated(message);
      } else if (message instanceof SessionTransparenceFileMissingEvaluationCommentUpdated) {
        await this.persistSessionTransparenceFileMissingEvaluationCommentUpdated(message);
      } else if (message instanceof SessionTransparenceFileAlertHidden) {
        await this.persistSessionTransparenceFileAlertHidden(message);
      } else if (message instanceof SessionTransparenceLolfiFilesAssociated) {
        await this.persistSessionTransparenceFilesAssociated(message);
      } else if (message instanceof SessionTransparenceValidated) {
        await this.persistSessionTransparenceValidated(message);
      } else if (message instanceof SessionTransparenceDeleted) {
        await this.persistSessionTransparenceDeleted(message);
      } else if (message instanceof SessionTransparenceArchived) {
        await this.persistSessionTransparenceArchived(message);
      } else {
        assertNever(message);
      }
    }

    return invalidations;
  }

  private async persistSessionTransparenceFileReportersAffected(
    message: SessionTransparenceFileReportersAffected,
  ) {
    const { versionId } = message;
    if (versionId) {
      const nominationFileIds = Array.from(
        new Set(message.affectations.map(({ nominationFileId }) => nominationFileId)),
      );

      await this.db.tx.nominationFileToReporter.deleteMany({
        where: {
          nominationFileId: { in: nominationFileIds },
          versionId,
        },
      });

      await this.db.tx.nominationFileToReporter.createMany({
        data: message.affectations.flatMap(({ reporterIds, nominationFileId }) =>
          reporterIds.map((userId) => ({
            nominationFileId,
            userId,
            versionId,
          })),
        ),
      });
    } else {
      await this.db.tx.affectationVersion.create({
        data: {
          affectations: {
            createMany: {
              data: message.affectations.flatMap(({ reporterIds, nominationFileId }) =>
                reporterIds.map((userId) => ({
                  nominationFileId,
                  userId,
                })),
              ),
            },
          },
          sessionId: message.sessionId,
        },
      });
    }
  }

  private persistSessionTransparenceFilePrioritiesUpdated(message: SessionTransparenceFilePrioritiesUpdated) {
    return this.db.tx.dossierDeNomination.update({
      data: { priorities: message.priorities as PriorityEnum[] },
      where: { id: message.nominationFileId, sessionId: message.sessionId },
    });
  }

  private async persistSessionTransparenceAffectationVersionPublished(
    message: SessionTransparenceAffectationVersionPublished,
  ): Promise<DocInvalidation[]> {
    const session = await this.db.tx.session.findUnique({
      select: {
        affectationVersions: {
          select: {
            affectations: {
              select: { nominationFileId: true, userId: true },
            },
          },
          where: { id: message.versionId },
        },
        // TODO: remove once report.formation is removed
        formation: true,
        id: true,
      } satisfies Prisma.SessionSelect,
      where: { deletedAt: null, id: message.sessionId },
    });

    if (!session) {
      this.logger.error(`tried assigning reports to unknown session "${message.sessionId}"`);
      throw new InternalServerErrorException();
    }

    let versionId: string;
    // We can't use upsert, since `message.versionId` is nullable. It doesn't appear in prisma TS error but at runtime
    if (message.versionId) {
      const affectationVersion = await this.db.tx.affectationVersion.update({
        data: {
          auteurPublicationId: message.userId,
          datePublication: this.clock.now(),
          sessionId: message.sessionId,
          statut: 'PUBLIEE',
        },
        select: { id: true } satisfies Prisma.AffectationVersionSelect,
        where: { id: message.versionId },
      });
      versionId = affectationVersion.id;
    } else {
      const affectationVersion = await this.db.tx.affectationVersion.create({
        data: {
          auteurPublicationId: message.userId,
          datePublication: this.clock.now(),
          sessionId: message.sessionId,
          statut: 'PUBLIEE',
        },
        select: { id: true } satisfies Prisma.AffectationVersionSelect,
      });
      versionId = affectationVersion.id;
    }

    await this.reports.internalSyncReportsWithAffectations({
      affectations: session.affectationVersions.flatMap(({ affectations }) =>
        affectations.map(({ nominationFileId, userId }) => ({ nominationFileId, reporterId: userId })),
      ),
      formation: prismaFormationEnumToFormationEnum(session.formation),
      sessionId: session.id,
    });

    return [
      {
        payload: { sessionId: message.sessionId, versionId },
        type: 'SessionAffectationVersionPublished',
      } satisfies DocInvalidation,
    ];
  }

  private async persistSessionTransparenceAffectationVersionCreated(
    message: SessionTransparenceAffectationVersionCreated,
  ) {
    let previousVersion: {
      affectations: { nominationFileId: string; userId: string }[];
      id: string;
    } | null = null;

    if (message.version.version > 1) {
      previousVersion = await this.db.tx.affectationVersion.findUnique({
        select: {
          affectations: { select: { nominationFileId: true, userId: true } },
          id: true,
        } satisfies Prisma.AffectationVersionSelect,
        where: {
          sessionId_version: {
            sessionId: message.sessionId,
            version: message.version.version - 1,
          },
        },
      });
    }

    await this.db.tx.session.update({
      data: {
        affectationVersions: {
          create: {
            createdBy: message.authorId,
            id: message.version.id,
            statut: 'BROUILLON',
            version: message.version.version,
          },
        },
      },
      where: { id: message.sessionId },
    });

    if (previousVersion) {
      await this.db.tx.nominationFileToReporter.createMany({
        data: previousVersion.affectations.map(({ nominationFileId, userId }) => ({
          nominationFileId,
          userId,
          versionId: message.version.id,
        })),
      });
    }
  }

  private async persistSessionTransparenceCreated(message: SessionTransparenceCreated) {
    const existingSession = await this.db.tx.session.findFirst({
      where: {
        date: message.date.toDate(),
        formation: message.formation,
        name: message.name,
      },
    });

    if (isDefined(existingSession)) {
      const { day, month, year } = message.date.toJson();
      const [paddedDay, paddedMonth] = [day, month].map((x) => x.toString().padStart(2, '0'));

      throw new ConflictException(
        `La session "T ${paddedDay}/${paddedMonth}/${year} - ${message.name}" existe déjà`,
      );
    }

    await this.db.tx.session.create({
      data: {
        date: message.date.toDate(),
        formation: message.formation,
        id: message.sessionId,
        name: message.name,
        transparenceGds: {
          create: {
            dueDate: message.dueDate?.toDate() ?? null,
            lolfiSessionId: message.lolfiSessionId,
            observationsClosingDate: message.observationClosingDate.toDate(),
            positionStartDate: message.positionStartDate?.toDate() ?? null,
          },
        },
        typeDeSaisine: message.typeDeSaisine,
      },
    });
  }

  private async persistLodamSessionTransparenceFilesCreated(message: LodamSessionTransparenceFilesCreated) {
    const session = await this.db.tx.sessionTransparenceGds.findUnique({
      select: { dueDate: true } satisfies Prisma.SessionTransparenceGdsSelect,
      where: { sessionId: message.sessionId },
    });

    await this.db.tx.$queryRawTyped(
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

  private async persistSessionTransparenceFilesObserversUpdated(
    message: SessionTransparenceFilesObserversUpdated,
  ) {
    for (const x of message.nominationFileObservers) {
      await this.db.tx.dossierDeNomination.update({
        data: { observers: x.observers as string[] },
        where: { id: x.id },
      });
    }
  }

  private async persistSessionTransparenceAttachmentAdded(message: SessionTransparenceAttachmentAdded) {
    await this.db.tx.sessionAttachment.create({
      data: { fileId: message.file.id, sessionId: message.sessionId },
    });
  }

  private async persistSessionTransparenceAttachmentRemoved(message: SessionTransparenceAttachmentRemoved) {
    const attachment = await this.db.tx.sessionAttachment.findFirst({
      select: {
        file: { select: { id: true, name: true, path: true } },
      } satisfies Prisma.SessionAttachmentSelect,
      where: { fileId: message.fileId, sessionId: message.sessionId },
    });

    if (!attachment) return;

    await this.db.tx.sessionAttachment.delete({
      where: {
        sessionId_fileId: {
          fileId: message.fileId,
          sessionId: message.sessionId,
        },
      },
    });

    this.files.delete([{ id: attachment.file.id, path: attachment.file.path }]);
  }

  private async persistSessionTransparenceFileAttachmentAdded(
    message: SessionTransparenceFileAttachmentAdded,
  ) {
    await this.db.tx.nominationFileAttachment.create({
      data: { fileId: message.file.id, nominationFileId: message.nominationFileId, type: message.type },
    });
  }

  private async persistSessionTransparenceFileAttachmentRemoved(
    message: SessionTransparenceFileAttachmentRemoved,
  ) {
    const attachment = await this.db.tx.nominationFileAttachment.findFirst({
      select: { file: { select: { id: true, path: true } } } satisfies Prisma.NominationFileAttachmentSelect,
      where: { fileId: message.fileId, nominationFileId: message.nominationFileId },
    });

    if (!attachment) return;

    await this.db.tx.nominationFileAttachment.delete({
      where: {
        primaryKey: {
          fileId: message.fileId,
          nominationFileId: message.nominationFileId,
        },
      },
    });

    this.files.delete([{ id: attachment.file.id, path: attachment.file.path }]);
  }

  private async persistSessionTransparenceUpdated(message: SessionTransparenceUpdated) {
    const invalidations: DocInvalidation[] = [];
    const old = await this.db.tx.session.findUnique({
      select: { date: true } satisfies Prisma.SessionSelect,
      where: { id: message.sessionId },
    });

    if (message.data.date.toDate().getTime() !== old?.date.getTime()) {
      invalidations.push({
        payload: {
          currentDate: message.data.date.toJson(),
          previousDate: old?.date ? DateOnly.fromUtcDate(old.date).toJson() : null,
          sessionId: message.sessionId,
        },
        type: 'SessionDateUpdated',
      });
    }

    await this.db.tx.session.update({
      data: {
        date: message.data.date.toDate(),
        name: message.data.name,
        transparenceGds: {
          update: {
            dueDate: message.data.dueDate?.toDate() ?? null,
            observationsClosingDate: message.data.observationsClosingDate.toDate(),
            positionStartDate: message.data.positionStartDate?.toDate() ?? null,
          },
        },
      },
      where: { id: message.sessionId },
    });

    return invalidations;
  }

  private async persistSessionTransparenceCommentWritten(message: SessionTransparenceCommentWritten) {
    await this.db.tx.session.update({
      data: { comment: message.comment },
      where: { id: message.sessionId },
    });

    await this.db.tx.sessionCommentVersion.create({
      data: {
        comment: message.comment,
        impersonatorId: message.impersonatorId,
        sessionId: message.sessionId,
        writtenAt: this.clock.now(),
        writtenBy: message.userId,
      },
    });
  }

  private async persistSessionTransparenceOutcomeDefined(
    message: SessionTransparenceOutcomeDefined,
  ): Promise<DocInvalidation[]> {
    await this.db.tx.dossierDeNomination.update({
      data: { outcome: message.outcome, outcomeComment: message.comment },
      where: { id: message.nominationFileId },
    });

    return [
      {
        payload: {
          comment: message.comment,
          nominationFileId: message.nominationFileId,
          outcome: message.outcome,
        },
        type: 'NominationFileOutcomeUpdated',
      },
    ];
  }

  private async persistSessionTransparenceAuditionScheduled(message: SessionTransparenceAuditionScheduled) {
    const audition = {
      date: message.auditionDateTime.date.toDate(),
      time: timeOnlyToDate(message.auditionDateTime.time),
    };

    const { auditionRequested } = await this.db.tx.dossierDeNomination.update({
      data: { auditionDate: audition.date, auditionTime: audition.time },
      select: { auditionRequested: true } satisfies Prisma.DossierDeNominationSelect,
      where: { id: message.nominationFileId, sessionId: message.sessionId },
    });
    await this.persistNominationFileAuditionVersion(message, { ...audition, requested: auditionRequested });
  }

  private async persistSessionTransparenceAuditionRequestDefined(
    message: SessionTransparenceAuditionRequestDefined,
  ) {
    // no audition is left to hold once dismissed: its date goes with it, in a single version
    const [file] = await this.db.tx.dossierDeNomination.updateManyAndReturn({
      data: message.requested
        ? { auditionRequested: true }
        : { auditionDate: null, auditionRequested: false, auditionTime: null },
      select: { auditionDate: true, auditionTime: true } satisfies Prisma.DossierDeNominationSelect,
      where: {
        OR: [{ auditionRequested: null }, { auditionRequested: !message.requested }],
        id: message.nominationFileId,
        sessionId: message.sessionId,
      },
    });
    if (!file) return;

    await this.persistNominationFileAuditionVersion(message, {
      date: file.auditionDate,
      requested: message.requested,
      time: file.auditionTime,
    });
  }

  private async persistSessionTransparenceAuditionsPublished(message: SessionTransparenceAuditionsPublished) {
    await this.db.tx.auditionPublication.create({
      data: {
        impersonatorId: message.impersonatorId,
        nominationFileAuditions: {
          createMany: {
            data: [...message.auditions.nominationFiles].map(
              ([nominationFileId, { audition, requested }]) => ({
                date: audition ? DateOnly.fromJson(audition.date).toDate() : null,
                nominationFileId,
                requested,
                time: audition ? timeOnlyToDate(audition.time) : null,
              }),
            ),
          },
        },
        observantAuditions: {
          createMany: {
            data: [...message.auditions.observants].map(([magistratId, audition]) => ({
              date: DateOnly.fromJson(audition.date).toDate(),
              magistratId,
              time: timeOnlyToDate(audition.time),
            })),
          },
        },
        publishedAt: this.clock.now(),
        publishedBy: message.userId,
        sessionId: message.sessionId,
      },
    });
  }

  private async persistSessionTransparenceAuditionUnScheduled(
    message: SessionTransparenceAuditionUnScheduled,
  ) {
    const [file] = await this.db.tx.dossierDeNomination.updateManyAndReturn({
      data: { auditionDate: null, auditionTime: null },
      select: { auditionRequested: true } satisfies Prisma.DossierDeNominationSelect,
      where: { auditionDate: { not: null }, id: message.nominationFileId, sessionId: message.sessionId },
    });
    if (!file) return;

    await this.persistNominationFileAuditionVersion(message, {
      date: null,
      requested: file.auditionRequested,
      time: null,
    });
  }

  private persistNominationFileAuditionVersion(
    message: { impersonatorId: string | null; nominationFileId: string; userId: string },
    audition: { date: Date | null; requested: boolean | null; time: Date | null },
  ) {
    return this.db.tx.nominationFileAuditionVersion.create({
      data: {
        ...audition,
        impersonatorId: message.impersonatorId,
        nominationFileId: message.nominationFileId,
        writtenAt: this.clock.now(),
        writtenBy: message.userId,
      },
    });
  }

  private async persistSessionTransparenceFileMemberMemoWritten(
    message: SessionTransparenceFileMemberMemoWritten,
  ) {
    await this.db.tx.memberMemo.upsert({
      create: {
        memo: message.memo,
        nominationFileId: message.nominationFileId,
        userId: message.userId,
      },

      update: { memo: message.memo },

      where: {
        primaryKey: {
          nominationFileId: message.nominationFileId,
          userId: message.userId,
        },
      },
    });
  }

  private async persistSessionTransparenceFileMissingEvaluationUpdated(
    message: SessionTransparenceFileMissingEvaluationUpdated,
  ) {
    await this.db.tx.dossierDeNomination.update({
      data: { missingEvaluation: message.missingEvaluation },
      where: { id: message.nominationFileId, sessionId: message.sessionId },
    });
  }

  private async persistSessionTransparenceFileMissingEvaluationCommentUpdated(
    message: SessionTransparenceFileMissingEvaluationCommentUpdated,
  ) {
    await this.db.tx.dossierDeNomination.update({
      data: { missingEvaluationComment: message.comment },
      where: { id: message.nominationFileId, sessionId: message.sessionId },
    });
  }

  private async persistSessionTransparenceFileAlertHidden(message: SessionTransparenceFileAlertHidden) {
    await this.db.tx.dossierDeNomination.update({
      data: { alertHidden: true },
      where: { id: message.nominationFileId, sessionId: message.sessionId },
    });
  }

  private async persistSessionTransparenceFilesAssociated(message: SessionTransparenceLolfiFilesAssociated) {
    const session = await this.db.tx.sessionTransparenceGds.findFirst({
      select: { dueDate: true } satisfies Prisma.SessionTransparenceGdsSelect,
      where: { sessionId: message.sessionId },
    });

    if (!session) {
      this.logger.error(`Tried reading due date from unknown session: ${message.sessionId}`);
      throw new InternalServerErrorException();
    }

    for (const file of message.files) {
      if (file.priorities.length) {
        const statement = file.priorities.reduce(
          (sql, priority) => Prisma.sql`ARRAY_REMOVE(${sql}, ${priority}::nominations_context.priorite_enum)`,
          Prisma.sql`"priorities"`,
        );

        await this.db.tx.$executeRaw`
          UPDATE "nominations_context"."dossier_de_nomination"
          SET "priorities" = ${statement}
          WHERE (
            "session_id" = ${message.sessionId}::UUID
            AND "number" = ${file.fileNumber}::INT
          )
        `;
      }

      await this.db.tx.dossierDeNomination.upsert({
        create: {
          biography: file.biography,
          birthDate: file.birthDate?.toDate(),
          currentPosition: file.currentPosition,
          detectedJurisdictionId: file.detectedJurisdictionId,
          detectedMagistratId: file.detectedMagistratId,
          detectedTargetedFunctionId: file.detectedTargetedFunctionId,
          detectedTargetedPositionId: file.detectedTargetedPositionId,
          dueDate: session.dueDate,
          externalId: file.externalId,
          grade: file.grade,
          id: makeId('LolfiNominationFileId'),
          lastPositionDate: file.lastPositionDate?.toDate(),
          lastRankingDate: file.lastRankingDate?.toDate(),
          name: file.name,
          number: file.fileNumber,
          priorities: file.priorities,
          rank: file.rank,
          sessionId: message.sessionId,
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
          number: file.fileNumber,
          priorities: { push: file.priorities },
          rank: file.rank,
          sortableTargetedGrade: file.sortableTargetedGrade,
          targetedGrade: file.targetedGrade,
          targetedPosition: file.targetedPosition,
        },
        where: {
          sessionExternalId: {
            externalId: file.externalId,
            sessionId: message.sessionId,
          },
        },
      });
    }
  }

  private async persistSessionTransparenceValidated(message: SessionTransparenceValidated) {
    await this.db.tx.session.update({
      data: {
        validatedAt: this.clock.now(),
        validatedBy: message.userId,
      },
      where: { id: message.sessionId },
    });
  }

  private async persistSessionTransparenceDeleted(message: SessionTransparenceDeleted) {
    await this.db.tx.session.update({
      data: { deletedAt: this.clock.now(), deletedBy: message.userId },
      where: { id: message.id },
    });
  }

  private async persistSessionTransparenceArchived(message: SessionTransparenceArchived) {
    await this.db.tx.session.update({
      data: { archivedAt: this.clock.now(), archivedBy: message.userId },
      where: { id: message.sessionId },
    });
  }
}
