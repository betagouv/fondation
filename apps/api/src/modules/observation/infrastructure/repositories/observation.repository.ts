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
import { PrismaService } from 'src/modules/framework/database';
import { Files } from 'src/modules/framework/files/files';
import { assertNever } from 'src/utils/assert-never';
import { makeId } from 'src/utils/id';

@Injectable()
export class ObservationRepository {
  private readonly logger = new Logger(ObservationRepository.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly files: Files,
  ) {}

  async findById(id: string): Promise<Observation> {
    const result = await this.prisma.observation.findUnique({
      where: { id },
      select: {
        id: true,
        magistratId: true,
        dateReception: true,

        nominationFileId: true,
        nominationFile: {
          select: {
            session: {
              select: {
                deletedAt: true,
                archivedAt: true,
              },
            },
          },
        },
      },
    });

    if (!result) throw new NotFoundException();

    if (result.nominationFile.session.archivedAt || result.nominationFile.session.deletedAt) {
      this.logger.warn(`tried updating an observation of an archived session`);
      throw new ForbiddenException();
    }

    return Observation.from({
      id: result.id,
      magistratId: result.magistratId,
      dateReception: result.dateReception,
      nominationFileId: result.nominationFileId,
    });
  }

  async persist(observation: Observation): Promise<void> {
    return this.prisma.$transaction(async (tx) => {
      for (const message of observation.messages) {
        if (message instanceof ObservationCreated) {
          await this.persistObservationCreated(tx, message);
        } else if (message instanceof ObservationFilesAttached) {
          await this.persistObservationFilesAttached(tx, message);
        } else if (message instanceof ObservationDeleted) {
          await this.persistObservationDeleted(tx, message);
        } else if (message instanceof ObservationUpdated) {
          await this.persistObservationUpdated(tx, message);
        } else if (message instanceof ObservationFilesDetached) {
          await this.persistObservationFilesDetached(tx, message);
        } else if (message instanceof ObservationMemberCommentWritten) {
          await this.persistObservationMemberCommentWritten(tx, message);
        } else if (message instanceof ObservationMemberCommentScreenshotsAttached) {
          await this.persistObservationMemberCommentScreenshotsAttached(tx, message);
        } else if (message instanceof ObservationFollowedUp) {
          await this.persistObservationFollowedUp(tx, message);
        } else if (message instanceof ObservationFileLinked) {
          await this.persistObservationFileLinked(tx, message);
        } else {
          assertNever(message);
        }
      }
    });
  }

  private persistObservationCreated(tx: Prisma.TransactionClient, message: ObservationCreated) {
    return tx.observation.create({
      data: {
        id: message.id,
        nominationFileId: message.nominationFileId,
        magistratId: message.magistratId,
        dateReception: message.dateReception,
        createdByUserId: message.createdByUserId,
        description: message.description || '',
      },
    });
  }

  private persistObservationFilesAttached(tx: Prisma.TransactionClient, message: ObservationFilesAttached) {
    return tx.observationFile.createMany({
      data: message.files.map((file) => ({
        observationId: message.observationId,
        fileId: file.id,
      })),
    });
  }

  private persistObservationDeleted(tx: Prisma.TransactionClient, message: ObservationDeleted) {
    return tx.observation.delete({
      where: { id: message.id },
    });
  }

  private persistObservationUpdated(tx: Prisma.TransactionClient, message: ObservationUpdated) {
    return tx.observation.update({
      where: { id: message.id },
      data: {
        dateReception: message.data.dateReception,
        magistratId: message.data.magistratId,
        description: message.data.description,
      },
    });
  }

  private async persistObservationFilesDetached(
    tx: Prisma.TransactionClient,
    message: ObservationFilesDetached,
  ) {
    const observation = await tx.observationFile.findMany({
      where: { fileId: { in: message.fileIds as string[] } },
      select: { file: { select: { id: true, path: true } } },
    });

    await tx.observationFile.deleteMany({
      where: { fileId: { in: observation.map(({ file }) => file.id) } },
    });

    this.files.delete(observation.map(({ file }) => file));
  }

  private async persistObservationMemberCommentWritten(
    tx: Prisma.TransactionClient,
    message: ObservationMemberCommentWritten,
  ) {
    return tx.observationMemberComment.upsert({
      where: {
        primaryKey: {
          userId: message.userId,
          observationId: message.observationId,
        },
      },
      create: {
        userId: message.userId,
        observationId: message.observationId,
        comment: message.comment,
      },
      update: {
        comment: message.comment,
        updatedAt: new Date(),
      },
    });
  }

  private async persistObservationMemberCommentScreenshotsAttached(
    tx: Prisma.TransactionClient,
    message: ObservationMemberCommentScreenshotsAttached,
  ) {
    await tx.observationMemberComment.upsert({
      where: {
        primaryKey: {
          userId: message.userId,
          observationId: message.observationId,
        },
      },
      create: {
        userId: message.userId,
        observationId: message.observationId,
        comment: '',
      },
      update: {},
    });

    await tx.observationMemberCommentScreenshot.createMany({
      data: message.files.map((file) => ({
        userId: message.userId,
        observationId: message.observationId,
        fileId: file.id,
      })),
      skipDuplicates: true,
    });
  }

  private async persistObservationFollowedUp(tx: Prisma.TransactionClient, message: ObservationFollowedUp) {
    if (message.followUp === null) {
      await tx.observation.update({
        where: { id: message.id },
        data: {
          followUp: null,
          followUpComment: null,
          followedUpByUserId: null,
          followedUpAt: null,
        },
      });
    } else {
      await tx.observation.update({
        where: { id: message.id },
        data: {
          followUp: message.followUp.status,
          followUpComment: message.followUp.comment,
          followedUpByUserId: message.userId,
          followedUpAt: new Date(),
        },
      });
    }
  }

  private async persistObservationFileLinked(tx: Prisma.TransactionClient, message: ObservationFileLinked) {
    const existingFile = await tx.file.findUnique({
      select: { name: true, path: true, bucket: true },
      where: { id: message.file.fileId },
    });

    if (!existingFile) {
      this.logger.error(`tried linking an observation to an unknown file`);
      throw new InternalServerErrorException();
    }

    const { bucket, path, name } = existingFile;
    const file = await tx.file.create({
      select: { id: true },
      data: {
        id: makeId('FileId'),
        bucket,
        path,
        name,
      },
    });

    await tx.observationFile.create({
      data: {
        fileId: file.id,
        observationId: message.id,
        originalFileId: message.file.fileId,
        originalObservationId: message.file.observationId,
      },
    });
  }
}
