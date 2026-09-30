import { Transactional } from '@nestjs-cls/transactional';
import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import {
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
import { Prisma } from 'src/generated/prisma/client';
import { Db } from 'src/modules/framework/database';
import { Files } from 'src/modules/framework/files/files';
import { assertNever } from 'src/utils/assert-never';
import { makeId } from 'src/utils/id';

@Injectable()
export class ObservationRepository {
  private readonly logger = new Logger(ObservationRepository.name);

  constructor(
    private readonly db: Db,
    private readonly files: Files,
  ) {}

  async findById(id: string): Promise<Observation> {
    const result = await this.db.tx.observation.findUnique({
      select: {
        dateReception: true,
        id: true,
        magistratId: true,
        nominationFile: {
          select: {
            session: {
              select: {
                archivedAt: true,
                deletedAt: true,
              },
            },
          },
        },
        nominationFileId: true,
      } satisfies Prisma.ObservationSelect,
      where: { id },
    });

    if (!result) throw new NotFoundException();

    if (result.nominationFile.session.archivedAt || result.nominationFile.session.deletedAt) {
      this.logger.warn(`tried updating an observation of an archived session`);
      throw new ForbiddenException();
    }

    return Observation.from({
      dateReception: result.dateReception,
      id: result.id,
      magistratId: result.magistratId,
      nominationFileId: result.nominationFileId,
    });
  }

  @Transactional()
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
    const observation = await this.db.tx.observationFile.findMany({
      select: { file: { select: { id: true, path: true } } } satisfies Prisma.ObservationFileSelect,
      where: { fileId: { in: message.fileIds as string[] } },
    });

    await this.db.tx.observationFile.deleteMany({
      where: { fileId: { in: observation.map(({ file }) => file.id) } },
    });

    this.files.delete(observation.map(({ file }) => file));
  }

  private async persistObservationMemberCommentWritten(message: ObservationMemberCommentWritten) {
    return this.db.tx.observationMemberComment.upsert({
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
