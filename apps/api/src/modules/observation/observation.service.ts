import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/modules/framework/database';
import { Files } from 'src/modules/framework/files';
import type { StoredFile } from 'src/modules/framework/files/multipart/multipart.types';
import { isDefined } from 'src/utils/is-defined';

import { Observation } from './domain/observation';
import { AttachedMemberCommentScreenshotsDto } from './infrastructure/dtos/observation-member-comment.dto';
import {
  GetObservationDetailsQuery,
  GetObservationDetailsResponseDto,
} from './infrastructure/queries/get-observation-details.query';
import {
  GetObservationFileUrlQuery,
  GetObservationFileUrlResponseDto,
} from './infrastructure/queries/get-observation-file-url.query';
import {
  ListObservationsQuery,
  ListObservationsResponseDto,
} from './infrastructure/queries/list-observations.query';
import { ObservationRepository } from './infrastructure/repositories/observation.repository';

@Injectable()
export class ObservationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly observationRepository: ObservationRepository,
    private readonly getObservationDetailsQuery: GetObservationDetailsQuery,
    private readonly getObservationFileUrlQuery: GetObservationFileUrlQuery,
    private readonly listObservationsQuery: ListObservationsQuery,
    private readonly files: Files,
  ) {}

  async createObservation(command: {
    userId: string;
    sessionId: string;
    nominationFileId: string;
    magistratId: string;
    dateReception: Date;
    files: readonly { id: string }[];
  }): Promise<{ id: string }> {
    const nominationFile = await this.prisma.dossierDeNomination.findUnique({
      where: { id: command.nominationFileId, sessionId: command.sessionId },
      select: { id: true },
    });

    if (!nominationFile) {
      throw new NotFoundException(
        `Nomination file with id ${command.nominationFileId} not found`,
      );
    }

    const existingObservation = await this.prisma.observation.findUnique({
      where: {
        nominationFileId_magistratId: {
          nominationFileId: command.nominationFileId,
          magistratId: command.magistratId,
        },
      },
      select: { id: true },
    });

    if (existingObservation) {
      throw new ConflictException(
        'Une observation de ce magistrat existe déjà pour ce dossier de nomination',
      );
    }

    const observation = Observation.create({
      nominationFileId: command.nominationFileId,
      magistratId: command.magistratId,
      dateReception: command.dateReception,
      createdByUserId: command.userId,
      files: command.files,
    });

    await this.observationRepository.persist(observation);

    return { id: observation.id };
  }

  async deleteObservation(command: {
    userId: string;
    observationId: string;
  }): Promise<void> {
    const observation = await this.observationRepository.findById(
      command.observationId,
    );

    observation.delete();
    await this.observationRepository.persist(observation);
  }

  async updateObservation(command: {
    observationId: string;
    dateReception: Date;
    magistratId: string;
    filesToAttach: readonly { id: string }[];
    fileIdsToDetach: readonly string[];
  }): Promise<void> {
    const observation = await this.observationRepository.findById(
      command.observationId,
    );

    if (command.magistratId !== observation.magistratId) {
      const existingObservation = await this.prisma.observation.findUnique({
        where: {
          nominationFileId_magistratId: {
            nominationFileId: observation.nominationFileId,
            magistratId: command.magistratId,
          },
        },
        select: { id: true },
      });

      if (existingObservation) {
        throw new ConflictException(
          'Une observation de ce magistrat existe déjà pour ce dossier de nomination',
        );
      }
    }

    observation.update({
      dateReception: command.dateReception,
      magistratId: command.magistratId,
    });

    if (command.filesToAttach.length > 0) {
      observation.attachFiles({ files: command.filesToAttach });
    }

    if (command.fileIdsToDetach.length > 0) {
      observation.detachFiles({ fileIds: command.fileIdsToDetach });
    }

    await this.observationRepository.persist(observation);
  }

  listObservations(query: {
    nominationFileId: string;
  }): Promise<ListObservationsResponseDto> {
    return this.listObservationsQuery.handle(query);
  }

  getObservationFileUrl(query: {
    observationId: string;
    fileId: string;
  }): Promise<GetObservationFileUrlResponseDto> {
    return this.getObservationFileUrlQuery.handle(query);
  }

  getObservationDetails(query: {
    userId: string;
    sessionId: string;
    nominationFileId: string;
    observationId: string;
  }): Promise<GetObservationDetailsResponseDto> {
    return this.getObservationDetailsQuery.handle(query);
  }

  async attachMemberCommentScreenshots(command: {
    userId: string;
    sessionId: string;
    nominationFileId: string;
    observationId: string;
    files: readonly StoredFile[];
  }): Promise<AttachedMemberCommentScreenshotsDto> {
    const observation = await this.observationRepository.findById(
      command.observationId,
    );

    observation.attachMemberCommentScreenshots({
      userId: command.userId,
      files: command.files.map((f) => ({ id: f.id })),
    });

    await this.observationRepository.persist(observation);

    const urls = await this.files.getPublicUrls(
      command.files.map((file) => file.id),
    );

    return {
      items: command.files
        .map((file) => {
          const url = urls[file.id]?.toString();
          if (!url) return undefined;

          return {
            id: file.id,
            name: file.name,
            url,
          };
        })
        .filter(isDefined),
    };
  }

  async writeMemberComment(command: {
    userId: string;
    sessionId: string;
    nominationFileId: string;
    observationId: string;
    comment: string;
  }): Promise<void> {
    const observation = await this.observationRepository.findById(
      command.observationId,
    );

    observation.writeMemberComment({
      userId: command.userId,
      comment: command.comment,
    });

    await this.observationRepository.persist(observation);
  }

  async followUpWith(command: {
    observationId: string;
    userId: string | null;
    followUp: string | null;
    comment: string | null;
  }): Promise<void> {
    const observation = await this.observationRepository.findById(
      command.observationId,
    );
    observation.followUpWith(command);
    await this.observationRepository.persist(observation);
  }
}
