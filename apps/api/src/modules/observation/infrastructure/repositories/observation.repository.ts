import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from 'src/modules/framework/database';
import { assertNever } from 'src/utils/assert-never';

import {
  Observation,
  ObservationCreated,
  ObservationDeleted,
  ObservationFilesAttached,
} from '../../domain/observation';

@Injectable()
export class ObservationRepository {
  constructor(private readonly prisma: PrismaService) {}

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
}
