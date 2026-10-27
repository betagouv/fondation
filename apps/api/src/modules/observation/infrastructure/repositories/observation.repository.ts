import { Propagation, Transactional } from '@nestjs-cls/transactional';
import {
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '../../../../generated/prisma/client';
import { assertNever } from '../../../../utils/assert-never';
import { makeId } from '../../../../utils/id';
import { fileIdsReferencedIn } from '../../../../utils/rich-text-html';
import { Clock } from '../../../framework/clock';
import { Db } from '../../../framework/database';
import { Files } from '../../../framework/files/files';
import { TransparenceService } from '../../../session/transparence/infrastructure/transparence.service';
import {
  ObservantAuditionDropped,
  Observation,
  ObservationCreated,
  ObservationDeleted,
  ObservationFileLinked,
  ObservationFilesAttached,
  ObservationFilesDetached,
  ObservationFollowedUp,
  ObservationMemberCommentScreenshotsAttached,
  ObservationMemberCommentWritten,
  ObservationUpdated,
} from '../../domain/observation';

@Injectable()
export class ObservationRepository {
  private readonly logger = new Logger(ObservationRepository.name);

  constructor(
    private readonly clock: Clock,
    private readonly db: Db,
    private readonly files: Files,
    @Inject(forwardRef(() => TransparenceService))
    private readonly sessions: TransparenceService,
  ) {}

  async findById(predicate: {
    nominationFileId: string;
    observationId: string;
    sessionId: string;
  }): Promise<Observation> {
    const result = await this.db.tx.observation.findUnique({
      select: {
        dateReception: true,
        id: true,
        magistratId: true,
        nominationFileId: true,
        sessionId: true,
      } satisfies Prisma.ObservationSelect,
      where: {
        id: predicate.observationId,
        nominationFileId: predicate.nominationFileId,
        sessionId: predicate.sessionId,
      },
    });

    if (!result) throw new NotFoundException();

    const state = await this.sessions.internalFindSessionState({ sessionId: result.sessionId });
    if (state !== 'OPEN') {
      this.logger.warn(`tried updating an observation of a ${state.toLowerCase()} session`);
      throw new ForbiddenException();
    }

    return Observation.from({
      dateReception: result.dateReception,
      id: result.id,
      magistratId: result.magistratId,
      nominationFileId: result.nominationFileId,
      sessionId: result.sessionId,
    });
  }

  async isLastOfObservant(observation: Observation): Promise<boolean> {
    const others = await this.db.tx.observation.count({
      where: {
        id: { not: observation.id },
        magistratId: observation.magistratId,
        sessionId: observation.sessionId,
      },
    });
    return others === 0;
  }

  @Transactional(Propagation.Mandatory)
  async persist(observation: Observation): Promise<void> {
    for (const message of observation.messages) {
      if (message instanceof ObservationCreated) {
        await this.persistObservationCreated(message);
      } else if (message instanceof ObservationFilesAttached) {
        await this.persistObservationFilesAttached(message);
      } else if (message instanceof ObservationDeleted) {
        await this.persistObservationDeleted(message);
      } else if (message instanceof ObservationUpdated) {
        await this.persistObservationUpdated(message);
      } else if (message instanceof ObservationFilesDetached) {
        await this.persistObservationFilesDetached(message);
      } else if (message instanceof ObservationMemberCommentWritten) {
        await this.persistObservationMemberCommentWritten(message);
      } else if (message instanceof ObservationMemberCommentScreenshotsAttached) {
        await this.persistObservationMemberCommentScreenshotsAttached(message);
      } else if (message instanceof ObservationFollowedUp) {
        await this.persistObservationFollowedUp(message);
      } else if (message instanceof ObservationFileLinked) {
        await this.persistObservationFileLinked(message);
      } else if (message instanceof ObservantAuditionDropped) {
        await this.persistObservantAuditionDropped(message);
      } else {
        assertNever(message);
      }
    }
  }

  private persistObservationCreated(message: ObservationCreated) {
    return this.db.tx.observation.create({
      data: {
        createdByUserId: message.createdByUserId,
        dateReception: message.dateReception,
        description: message.description || '',
        id: message.id,
        magistratId: message.magistratId,
        nominationFileId: message.nominationFileId,
        sessionId: message.sessionId,
      },
    });
  }

  private persistObservationFilesAttached(message: ObservationFilesAttached) {
    return this.db.tx.observationFile.createMany({
      data: message.files.map((file) => ({
        fileId: file.id,
        observationId: message.observationId,
      })),
    });
  }

  private async persistObservationDeleted(message: ObservationDeleted) {
    const files = await this.db.tx.observationFile.findMany({
      select: { file: { select: { id: true, path: true } } } satisfies Prisma.ObservationFileSelect,
      where: { observationId: message.id },
    });

    await this.db.tx.observation.delete({ where: { id: message.id } });
    this.files.delete(files.map(({ file }) => file));
  }

  private async persistObservantAuditionDropped(message: ObservantAuditionDropped) {
    const { count } = await this.db.tx.observantAudition.deleteMany({
      where: { magistratId: message.magistratId, sessionId: message.sessionId },
    });
    if (count === 0) return;

    await this.db.tx.observantAuditionVersion.create({
      data: {
        date: null,
        impersonatorId: message.impersonatorId,
        magistratId: message.magistratId,
        sessionId: message.sessionId,
        time: null,
        writtenAt: this.clock.now(),
        writtenBy: message.userId,
      },
    });
  }

  private persistObservationUpdated(message: ObservationUpdated) {
    return this.db.tx.observation.update({
      data: {
        dateReception: message.data.dateReception,
        description: message.data.description,
        magistratId: message.data.magistratId,
      },
      where: { id: message.id },
    });
  }

  private async persistObservationFilesDetached(message: ObservationFilesDetached) {
    const detached = await this.db.tx.observationFile.findMany({
      select: { file: { select: { id: true, path: true } } } satisfies Prisma.ObservationFileSelect,
      where: { fileId: { in: [...message.fileIds] }, observationId: message.observationId },
    });

    await this.db.tx.observationFile.deleteMany({
      where: { fileId: { in: detached.map(({ file }) => file.id) }, observationId: message.observationId },
    });

    this.files.delete(detached.map(({ file }) => file));
  }

  private async persistObservationMemberCommentWritten(message: ObservationMemberCommentWritten) {
    await this.db.tx.observationMemberComment.upsert({
      create: {
        comment: message.comment,
        observationId: message.observationId,
        userId: message.userId,
      },
      update: {
        comment: message.comment,
        updatedAt: new Date(),
      },
      where: {
        primaryKey: {
          observationId: message.observationId,
          userId: message.userId,
        },
      },
    });
    await this.markScreenshotsAbsentFrom(message);
  }

  // a screenshot leaves with the comment that embedded it and comes back with it, an undo included
  private async markScreenshotsAbsentFrom(message: {
    comment: string;
    observationId: string;
    userId: string;
  }) {
    const embedded = [...fileIdsReferencedIn(message.comment)];
    const comment = { observationId: message.observationId, userId: message.userId };

    await this.db.tx.observationMemberCommentScreenshot.updateMany({
      data: { detachedAt: this.clock.now() },
      where: { ...comment, detachedAt: null, fileId: { notIn: embedded } },
    });
    await this.db.tx.observationMemberCommentScreenshot.updateMany({
      data: { detachedAt: null },
      where: { ...comment, detachedAt: { not: null }, fileId: { in: embedded } },
    });
  }

  private async persistObservationMemberCommentScreenshotsAttached(
    message: ObservationMemberCommentScreenshotsAttached,
  ) {
    await this.db.tx.observationMemberComment.upsert({
      create: {
        comment: '',
        observationId: message.observationId,
        userId: message.userId,
      },
      update: {},
      where: {
        primaryKey: {
          observationId: message.observationId,
          userId: message.userId,
        },
      },
    });

    await this.db.tx.observationMemberCommentScreenshot.createMany({
      data: message.files.map((file) => ({
        fileId: file.id,
        observationId: message.observationId,
        userId: message.userId,
      })),
      skipDuplicates: true,
    });
  }

  private async persistObservationFollowedUp(message: ObservationFollowedUp) {
    if (message.followUp === null) {
      await this.db.tx.observation.update({
        data: {
          followedUpAt: null,
          followedUpByUserId: null,
          followUp: null,
          followUpComment: null,
        },
        where: { id: message.id },
      });
    } else {
      await this.db.tx.observation.update({
        data: {
          followedUpAt: new Date(),
          followedUpByUserId: message.userId,
          followUp: message.followUp.status,
          followUpComment: message.followUp.comment,
        },
        where: { id: message.id },
      });
    }
  }

  private async persistObservationFileLinked(message: ObservationFileLinked) {
    const existingFile = await this.db.tx.file.findUnique({
      select: {
        bucket: true,
        createdAt: true,
        createdById: true,
        name: true,
        path: true,
        sizeInBytes: true,
      } satisfies Prisma.FileSelect,
      where: { id: message.file.fileId },
    });

    if (!existingFile) {
      this.logger.error(`tried linking an observation to an unknown file`);
      throw new InternalServerErrorException();
    }

    const file = await this.db.tx.file.create({
      data: { ...existingFile, id: makeId('FileId') },
      select: { id: true } satisfies Prisma.FileSelect,
    });

    await this.db.tx.observationFile.create({
      data: {
        fileId: file.id,
        observationId: message.id,
        originalFileId: message.file.fileId,
        originalObservationId: message.file.observationId,
      },
    });
  }
}
