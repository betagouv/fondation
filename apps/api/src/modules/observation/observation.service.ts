import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from 'src/modules/framework/database';

import { Observation } from './domain/observation';
import { ObservationRepository } from './infrastructure/repositories/observation.repository';
import {
  GetObservationFileUrlQuery,
  GetObservationFileUrlResponseDto,
} from './infrastructure/queries/get-observation-file-url.query';
import {
  ListObservationsQuery,
  ListObservationsResponseDto,
} from './infrastructure/queries/list-observations.query';
import {
  SearchMagistratsQuery,
  SearchMagistratsResponseDto,
} from './infrastructure/queries/search-magistrats.query';

@Injectable()
export class ObservationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly observationRepository: ObservationRepository,
    private readonly getObservationFileUrlQuery: GetObservationFileUrlQuery,
    private readonly listObservationsQuery: ListObservationsQuery,
    private readonly searchMagistratsQuery: SearchMagistratsQuery,
  ) {}

  async createObservation(command: {
    userId: string;
    nominationFileId: string;
    magistratId: string;
    dateReception: Date;
    files: readonly { id: string }[];
  }): Promise<{ id: string }> {
    const nominationFile = await this.prisma.dossierDeNomination.findUnique({
      where: { id: command.nominationFileId },
      select: { id: true },
    });

    if (!nominationFile) {
      throw new NotFoundException(
        `Nomination file with id ${command.nominationFileId} not found`,
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

  searchMagistrats(query: {
    search: string;
    limit?: number;
  }): Promise<SearchMagistratsResponseDto> {
    return this.searchMagistratsQuery.handle(query);
  }

  getObservationFileUrl(query: {
    observationId: string;
    fileId: string;
  }): Promise<GetObservationFileUrlResponseDto> {
    return this.getObservationFileUrlQuery.handle(query);
  }
}
