import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from 'src/modules/framework/database';
import { Files } from 'src/modules/framework/files/files';
import { assertNever } from 'src/utils/assert-never';

import {
  Observation,
  ObservationCreated,
  ObservationDeleted,
  ObservationFilesAttached,
  ObservationFilesDetached,
  ObservationMemberCommentScreenshotsAttached,
  ObservationMemberCommentWritten,
  ObservationUpdated,
} from '../../domain/observation';

@Injectable()
export class ObservationRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly files: Files,
  ) {}

  async findById(id: string): Promise<Observation> {
    const result = await this.prisma.observation.findUnique({
      where: { id },
      select: {
        id: true,
        nominationFileId: true,
        magistratId: true,
        dateReception: true,
      },
    });

    if (!result) throw new NotFoundException();

    return Observation.from({
      id: result.id,
      nominationFileId: result.nominationFileId,
      magistratId: result.magistratId,
      dateReception: result.dateReception,
    });
  }

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
      } else if (
        message instanceof ObservationMemberCommentScreenshotsAttached
      ) {
        await this.persistObservationMemberCommentScreenshotsAttached(message);
      } else {
        assertNever(message);
      }
    }
  }

  private async persistObservationCreated(message: ObservationCreated) {
    await this.prisma.observation.create({
      data: {
        id: message.id,
        nominationFileId: message.nominationFileId,
        magistratId: message.magistratId,
        dateReception: message.dateReception,
        createdByUserId: message.createdByUserId,
      },
    });
  }

  private async persistObservationFilesAttached(
    message: ObservationFilesAttached,
  ) {
    await this.prisma.observationFile.createMany({
      data: message.files.map((file) => ({
        observationId: message.observationId,
        fileId: file.id,
      })),
    });
  }

  private async persistObservationDeleted(message: ObservationDeleted) {
    await this.prisma.observation.delete({
      where: { id: message.id },
    });
  }

  private async persistObservationUpdated(message: ObservationUpdated) {
    await this.prisma.observation.update({
      where: { id: message.id },
      data: {
        dateReception: message.data.dateReception,
        magistratId: message.data.magistratId,
      },
    });
  }

  private async persistObservationFilesDetached(
    message: ObservationFilesDetached,
  ) {
    const files = await this.prisma.file.findMany({
      where: { id: { in: message.fileIds as string[] } },
      select: { path: true },
    });

    await this.files.delete(files.map((f) => f.path.join('/')));
  }

  private async persistObservationMemberCommentWritten(
    message: ObservationMemberCommentWritten,
  ) {
    await this.prisma.observationMemberComment.upsert({
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
    message: ObservationMemberCommentScreenshotsAttached,
  ) {
    await this.prisma.observationMemberComment.upsert({
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

    await this.prisma.observationMemberCommentScreenshot.createMany({
      data: message.files.map((file) => ({
        userId: message.userId,
        observationId: message.observationId,
        fileId: file.id,
      })),
      skipDuplicates: true,
    });
  }
}
