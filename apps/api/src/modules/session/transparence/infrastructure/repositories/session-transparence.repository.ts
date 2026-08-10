import { Propagation, Transactional } from '@nestjs-cls/transactional';
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { AffectationVersionFinder } from '../finders/affectation-version.finder';
import { TransparenceFilesFinder } from '../finders/transparence-files.finder';
import { Prisma } from 'src/generated/prisma/client';
import {
  deleteReportsAfterAffectationPublicationRawQuery,
  insertLodamNominationFilesRawQuery,
} from 'src/generated/prisma/sql';
import { OfficialReportInvalidation } from 'src/modules/docs/shared/domain/invalidation/official-report-invalidated.integration-event';
import { Clock } from 'src/modules/framework/clock';
import { Db } from 'src/modules/framework/database';
import { Files } from 'src/modules/framework/files';
import {
  LodamSessionTransparenceFilesCreated,
  SessionTransparence,
  SessionTransparenceAffectationVersionCreated,
  SessionTransparenceAffectationVersionPublished,
  SessionTransparenceArchived,
  SessionTransparenceAttachmentAdded,
  SessionTransparenceAttachmentRemoved,
  SessionTransparenceAuditionScheduled,
  SessionTransparenceAuditionUnScheduled,
  SessionTransparenceCreated,
  SessionTransparenceDeleted,
  SessionTransparenceFileAlertHidden,
  SessionTransparenceFileAttachmentAdded,
  SessionTransparenceFileAttachmentRemoved,
  SessionTransparenceFileMemberMemoWritten,
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
import { makeId } from 'src/utils/id';
import { isDefined } from 'src/utils/is-defined';
import { timeOnlyToDate } from 'src/utils/time-only';

import { getAllNominationSessionReportRules } from './nomination-session-report-rules';
import { gradeEnumToSortableTargetedGrade } from './sortable-targeted-grade';

@Injectable()
export class SessionTransparenceRepository {
  private readonly logger = new Logger(SessionTransparenceRepository.name);

  constructor(
    private readonly clock: Clock,
    private readonly db: Db,
    private readonly affectationVersionFinder: AffectationVersionFinder,
    private readonly files: Files,
    private readonly transparenceFilesFinder: TransparenceFilesFinder,
  ) {}

  @Transactional()
  async find(
    id: string,
    options: {
      nominationFileIds?: Set<string>;
    } = {},
  ): Promise<SessionTransparence> {
    const session = await this.db.tx.session.findUnique({
      where: { id, deletedAt: null },
      select: {
        id: true,
        formation: true,
        archivedAt: true,
        typeDeSaisine: true,
      },
    });

    if (!session) throw new NotFoundException();
    if (session.archivedAt) throw new SessionTransparenceIsArchived(id);

    // FIXME: remove once we know how to rehydrate a mtt session
    if (session.typeDeSaisine !== 'TRANSPARENCE_GDS') throw new NotFoundException();

    const nominationFiles = await this.transparenceFilesFinder.findDocsSnapshots({
      sessionId: session.id,
      nominationFileIds: options.nominationFileIds,
    });

    const optionalVersion = await this.affectationVersionFinder.last({
      sessionId: id,
    });

    return SessionTransparence.from({
      id,
      nominationFiles,
      formation: prismaFormationEnumToFormationEnum(session.formation),
      version: optionalVersion.map(({ id, status, version }) => ({
        id,
        version,
        isDraft: status === 'BROUILLON',
      })),
    });
  }

  @Transactional()
  async findByLolfiSessionId(lolfiSessionId: number): Promise<{
    [K in FormationEnum]?: { isArchived: false; session: SessionTransparence } | { isArchived: true };
  }> {
    const sessions = await this.db.tx.sessionTransparenceGds.findMany({
      select: { session: { select: { id: true, archivedAt: true, formation: true } } },
      where: { lolfiSessionId },
    });

    if (sessions.length > 2) {
      this.logger.error(`More than 2 sessions found for lolfiSessionId: ${lolfiSessionId}`);

      throw new InternalServerErrorException();
    }

    if (sessions.length === 0) return {};

    const entries = await Promise.all(
      sessions.map(async ({ session: s }) => {
        if (s.archivedAt) return [s.formation, { isArchived: true }] as const;

        const session = await this.find(s.id);
        return [s.formation, { session, isArchived: false }] as const;
      }),
    );

    return Object.fromEntries(entries);
  }

  @Transactional(Propagation.Mandatory)
  async persist(session: SessionTransparence): Promise<OfficialReportInvalidation[]> {
    const invalidations: OfficialReportInvalidation[] = [];

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
      } else if (message instanceof SessionTransparenceOutcomeDefined) {
        invalidations.push(...(await this.persistSessionTransparenceOutcomeDefined(message)));
      } else if (message instanceof SessionTransparenceAuditionScheduled) {
        await this.persistSessionTransparenceAuditionScheduled(message);
      } else if (message instanceof SessionTransparenceAuditionUnScheduled) {
        await this.persistSessionTransparenceAuditionUnScheduled(message);
      } else if (message instanceof SessionTransparenceFileMemberMemoWritten) {
        await this.persistSessionTransparenceFileMemberMemoWritten(message);
      } else if (message instanceof SessionTransparenceFileMissingEvaluationUpdated) {
        await this.persistSessionTransparenceFileMissingEvaluationUpdated(message);
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
          versionId,
          nominationFileId: { in: nominationFileIds },
        },
      });

      await this.db.tx.nominationFileToReporter.createMany({
        data: message.affectations.flatMap(({ reporterIds, nominationFileId }) =>
          reporterIds.map((userId) => ({
            userId,
            versionId,
            nominationFileId,
          })),
        ),
      });
    } else {
      await this.db.tx.affectationVersion.create({
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

  private persistSessionTransparenceFilePrioritiesUpdated(message: SessionTransparenceFilePrioritiesUpdated) {
    return this.db.tx.dossierDeNomination.update({
      where: { id: message.nominationFileId, sessionId: message.sessionId },
      data: { priorities: message.priorities as PriorityEnum[] },
    });
  }

  private async persistSessionTransparenceAffectationVersionPublished(
    message: SessionTransparenceAffectationVersionPublished,
  ): Promise<OfficialReportInvalidation[]> {
    const session = await this.db.tx.session.findUnique({
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
      const affectationVersion = await this.db.tx.affectationVersion.update({
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
      const affectationVersion = await this.db.tx.affectationVersion.create({
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
      const [existingReport] = await this.db.tx.report.updateManyAndReturn({
        select: { id: true },
        data: { isDeleted: false },
        where: {
          sessionId: reportToCreate.sessionId,
          reporterId: reportToCreate.reporterId,
          nominationFileId: reportToCreate.nominationFileId,
        },
      });

      if (!existingReport) {
        await this.db.tx.report.create({
          data: {
            ...reportToCreate,
            reportRules: {
              createMany: { data: getAllNominationSessionReportRules() },
            },
          },
        });
      }
    }

    if (!versionId) return [];

    await this.db.tx.$queryRawTyped(
      deleteReportsAfterAffectationPublicationRawQuery(message.sessionId, versionId),
    );
    return [
      {
        type: 'SessionAffectationVersionPublished',
        payload: { sessionId: message.sessionId, versionId },
      } satisfies OfficialReportInvalidation,
    ];
  }

  private async persistSessionTransparenceAffectationVersionCreated(
    message: SessionTransparenceAffectationVersionCreated,
  ) {
    let previousVersion: {
      id: string;
      affectations: { nominationFileId: string; userId: string }[];
    } | null = null;

    if (message.version.version > 1) {
      previousVersion = await this.db.tx.affectationVersion.findUnique({
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

    await this.db.tx.session.update({
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
      await this.db.tx.nominationFileToReporter.createMany({
        data: previousVersion.affectations.map(({ nominationFileId, userId }) => ({
          versionId: message.version.id,
          nominationFileId,
          userId,
        })),
      });
    }
  }

  private async persistSessionTransparenceCreated(message: SessionTransparenceCreated) {
    const existingSession = await this.db.tx.session.findFirst({
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

    await this.db.tx.session.create({
      data: {
        id: message.sessionId,
        name: message.name,
        typeDeSaisine: message.typeDeSaisine,
        formation: message.formation,
        date: message.date.toDate(),

        transparenceGds: {
          create: {
            lolfiSessionId: message.lolfiSessionId,
            dueDate: message.dueDate?.toDate() ?? null,
            positionStartDate: message.positionStartDate?.toDate() ?? null,
            observationsClosingDate: message.observationClosingDate.toDate(),
          },
        },
      },
    });
  }

  private async persistLodamSessionTransparenceFilesCreated(message: LodamSessionTransparenceFilesCreated) {
    const session = await this.db.tx.sessionTransparenceGds.findUnique({
      where: { sessionId: message.sessionId },
      select: { dueDate: true },
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
      data: { sessionId: message.sessionId, fileId: message.file.id },
    });
  }

  private async persistSessionTransparenceAttachmentRemoved(message: SessionTransparenceAttachmentRemoved) {
    const attachment = await this.db.tx.sessionAttachment.findFirst({
      where: { fileId: message.fileId, sessionId: message.sessionId },
      select: { file: { select: { path: true, name: true, id: true } } },
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
      data: { nominationFileId: message.nominationFileId, fileId: message.file.id },
    });
  }

  private async persistSessionTransparenceFileAttachmentRemoved(
    message: SessionTransparenceFileAttachmentRemoved,
  ) {
    const attachment = await this.db.tx.nominationFileAttachment.findFirst({
      where: { fileId: message.fileId, nominationFileId: message.nominationFileId },
      select: { file: { select: { path: true, id: true } } },
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
    const invalidations: OfficialReportInvalidation[] = [];
    const old = await this.db.tx.session.findUnique({
      where: { id: message.sessionId },
      select: { date: true },
    });

    if (message.data.date.toDate().getTime() !== old?.date.getTime()) {
      invalidations.push({
        type: 'SessionDateUpdated',
        payload: { sessionId: message.sessionId, date: message.data.date.toJson() },
      });
    }

    await this.db.tx.session.update({
      where: { id: message.sessionId },
      data: {
        name: message.data.name,
        date: message.data.date.toDate(),

        transparenceGds: {
          update: {
            dueDate: message.data.dueDate?.toDate() ?? null,
            positionStartDate: message.data.positionStartDate?.toDate() ?? null,
            observationsClosingDate: message.data.observationsClosingDate.toDate(),
          },
        },
      },
    });

    return invalidations;
  }

  private async persistSessionTransparenceOutcomeDefined(
    message: SessionTransparenceOutcomeDefined,
  ): Promise<OfficialReportInvalidation[]> {
    await this.db.tx.dossierDeNomination.update({
      where: { id: message.nominationFileId },
      data: { outcome: message.outcome, outcomeComment: message.comment },
    });

    return [
      {
        type: 'NominationFileOutcomeUpdated',
        payload: {
          nominationFileId: message.nominationFileId,
          comment: message.comment,
          outcome: message.outcome,
        },
      },
    ];
  }

  private async persistSessionTransparenceAuditionScheduled(message: SessionTransparenceAuditionScheduled) {
    await this.db.tx.dossierDeNomination.update({
      where: { id: message.nominationFileId, sessionId: message.sessionId },
      data: {
        auditionDate: message.auditionDateTime.date.toDate(),
        auditionTime: timeOnlyToDate(message.auditionDateTime.time),
      },
    });
  }

  private async persistSessionTransparenceAuditionUnScheduled(
    message: SessionTransparenceAuditionUnScheduled,
  ) {
    await this.db.tx.dossierDeNomination.update({
      where: { id: message.nominationFileId, sessionId: message.sessionId },
      data: { auditionDate: null, auditionTime: null },
    });
  }

  private async persistSessionTransparenceFileMemberMemoWritten(
    message: SessionTransparenceFileMemberMemoWritten,
  ) {
    await this.db.tx.memberMemo.upsert({
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

  private async persistSessionTransparenceFileMissingEvaluationUpdated(
    message: SessionTransparenceFileMissingEvaluationUpdated,
  ) {
    await this.db.tx.dossierDeNomination.update({
      where: { sessionId: message.sessionId, id: message.nominationFileId },
      data: { missingEvaluation: message.missingEvaluation },
    });
  }

  private async persistSessionTransparenceFileAlertHidden(message: SessionTransparenceFileAlertHidden) {
    await this.db.tx.dossierDeNomination.update({
      where: { sessionId: message.sessionId, id: message.nominationFileId },
      data: { alertHidden: true },
    });
  }

  private async persistSessionTransparenceFilesAssociated(message: SessionTransparenceLolfiFilesAssociated) {
    const session = await this.db.tx.sessionTransparenceGds.findFirst({
      where: { sessionId: message.sessionId },
      select: { dueDate: true },
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
        where: {
          sessionExternalId: {
            sessionId: message.sessionId,
            externalId: file.externalId,
          },
        },
        create: {
          id: makeId('LolfiNominationFileId'),
          sessionId: message.sessionId,
          externalId: file.externalId,
          number: file.fileNumber,

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
          priorities: file.priorities,
          rank: file.rank,
          sortableTargetedGrade: file.sortableTargetedGrade,
          targetedGrade: file.targetedGrade,
          targetedPosition: file.targetedPosition,
        },
        update: {
          number: file.fileNumber,
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
          priorities: { push: file.priorities },
          rank: file.rank,
          sortableTargetedGrade: file.sortableTargetedGrade,
          targetedGrade: file.targetedGrade,
          targetedPosition: file.targetedPosition,
        },
      });
    }
  }

  private async persistSessionTransparenceValidated(message: SessionTransparenceValidated) {
    await this.db.tx.sessionTransparenceGds.update({
      where: { sessionId: message.sessionId },
      data: {
        validatedBy: message.userId,
        validatedAt: this.clock.now(),
      },
    });
  }

  private async persistSessionTransparenceDeleted(message: SessionTransparenceDeleted) {
    await this.db.tx.session.update({
      where: { id: message.id },
      data: { deletedAt: this.clock.now(), deletedBy: message.userId },
    });
  }

  private async persistSessionTransparenceArchived(message: SessionTransparenceArchived) {
    await this.db.tx.session.update({
      where: { id: message.sessionId },
      data: { archivedAt: this.clock.now(), archivedBy: message.userId },
    });
  }
}
