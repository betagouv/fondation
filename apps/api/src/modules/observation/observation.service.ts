import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { TransparenceService } from '../session/transparence/infrastructure/transparence.service';
import { Db } from 'src/modules/framework/database';
import { Files } from 'src/modules/framework/files';
import type { StoredFile } from 'src/modules/framework/files/multipart/multipart.types';
import { isDefined } from 'src/utils/is-defined';

import {
  Observation,
  UserNotAllowedToAttachScreenshotsError,
  UserNotAllowedToWriteCommentError,
} from './domain/observation';
import { AttachedMemberCommentScreenshotsDto } from './infrastructure/dtos/observation-member-comment.dto';
import { ObservationFinder } from './infrastructure/finders/observation.finder';
import {
  GetObservationDetailsQuery,
  GetObservationDetailsResponseDto,
} from './infrastructure/queries/get-observation-details.query';
import {
  GetObservationFileUrlQuery,
  GetObservationFileUrlResponseDto,
} from './infrastructure/queries/get-observation-file-url.query';
import {
  ListedObservationsAttachmentsDto,
  ListObservationsAttachmentsQuery,
} from './infrastructure/queries/list-observations-attachments.query';
import {
  ListObservationsQuery,
  ListObservationsResponseDto,
} from './infrastructure/queries/list-observations.query';
import { ObservationRepository } from './infrastructure/repositories/observation.repository';

@Injectable()
export class ObservationService {
  private readonly logger = new Logger(ObservationService.name);

  constructor(
    private readonly db: Db,
    private readonly observationRepository: ObservationRepository,
    private readonly getObservationDetailsQuery: GetObservationDetailsQuery,
    private readonly getObservationFileUrlQuery: GetObservationFileUrlQuery,
    private readonly listObservationsQuery: ListObservationsQuery,
    private readonly files: Files,
    private readonly listObservationsAttachmentsQuery: ListObservationsAttachmentsQuery,
    private readonly observationFinder: ObservationFinder,

    @Inject(forwardRef(() => TransparenceService))
    private readonly transparences: TransparenceService,
  ) {}

  async createObservation(command: {
    userId: string;
    sessionId: string;
    nominationFileId: string;
    magistratId: string;
    dateReception: Date;
    description: string | undefined | null;
    files: readonly { id: string }[];
    linkedAttachments: readonly {
      observationId: string;
      fileId: string;
    }[];
  }): Promise<{ id: string }> {
    const [nominationFile, linkedFiles] = await this.db.withTransaction(async () => {
      const txNominationFile = await this.observationFinder.findExistingObservation({
        sessionId: command.sessionId,
        nominationFileId: command.nominationFileId,
        magistratId: command.magistratId,
      });

      const { items: txLinkedFiles } = await this.observationFinder.findExistingFiles({
        files: command.linkedAttachments.map((attachment) => ({
          ...attachment,
          magistratId: command.magistratId,
        })),
      });

      return [txNominationFile, txLinkedFiles];
    });

    if (!nominationFile) {
      throw new NotFoundException();
    }

    if (linkedFiles.length !== command.linkedAttachments.length) {
      this.logger.warn(
        `Did not find some linked attachments:\nCommand: \n  ${command.linkedAttachments.map((x) => '  - ' + JSON.stringify(x)).join('\n')}\n\nFound:\n   ${linkedFiles.map((x) => '  -' + JSON.stringify(x)).join('\n')}`,
      );
      throw new BadRequestException();
    }

    const observation = Observation.create({
      linkedFiles,
      nominationFile,
      files: command.files,
      createdByUserId: command.userId,
      description: command.description,
      magistratId: command.magistratId,
      dateReception: command.dateReception,
    });

    await this.observationRepository.persist(observation);

    return { id: observation.id };
  }

  async deleteObservation(command: { userId: string; observationId: string }): Promise<void> {
    const observation = await this.observationRepository.findById(command.observationId);

    observation.delete();
    await this.observationRepository.persist(observation);
  }

  async updateObservation(command: {
    observationId: string;
    dateReception: Date;
    magistratId: string;
    description: string | null | undefined;
    linkedFiles: readonly { observationId: string; fileId: string }[];
    filesToAttach: readonly { id: string }[];
    fileIdsToDetach: readonly string[];
  }): Promise<void> {
    const observation = await this.observationRepository.findById(command.observationId);

    if (command.magistratId !== observation.magistratId) {
      const existingObservation = await this.db.tx.observation.findUnique({
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
      description: command.description,
    });
    observation.attachFiles({ files: command.filesToAttach });
    observation.detachFiles({ fileIds: command.fileIdsToDetach });
    observation.linkFiles({ files: command.linkedFiles });

    await this.observationRepository.persist(observation);
  }

  listObservations(query: { nominationFileId: string }): Promise<ListObservationsResponseDto> {
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
    const reporters = await this.transparences.versions.findReporters({
      nominationFileId: command.nominationFileId,
      sessionId: command.sessionId,
    });
    const reporterIds = reporters.map(({ id }) => id);

    const observation = await this.observationRepository.findById(command.observationId);

    try {
      observation.attachMemberCommentScreenshots({
        userId: command.userId,
        reporterIds,
        files: command.files.map((f) => ({ id: f.id })),
      });
    } catch (error) {
      if (error instanceof UserNotAllowedToAttachScreenshotsError) {
        throw new ForbiddenException();
      }
      throw error;
    }

    await this.observationRepository.persist(observation);

    const urls = await this.files.getPublicUrls(command.files.map((file) => file.id));

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
    const reporters = await this.transparences.versions.findReporters({
      nominationFileId: command.nominationFileId,
      sessionId: command.sessionId,
    });
    const reporterIds = reporters.map(({ id }) => id);

    const observation = await this.observationRepository.findById(command.observationId);

    try {
      observation.writeMemberComment({
        userId: command.userId,
        reporterIds,
        comment: command.comment,
      });
    } catch (error) {
      if (error instanceof UserNotAllowedToWriteCommentError) {
        throw new ForbiddenException();
      }
      throw error;
    }

    await this.observationRepository.persist(observation);
  }

  async followUpWith(command: {
    observationId: string;
    userId: string | null;
    followUp: string | null;
    comment: string | null;
  }): Promise<void> {
    const observation = await this.observationRepository.findById(command.observationId);
    observation.followUpWith(command);
    await this.observationRepository.persist(observation);
  }

  listObservationsAttachments(query: {
    sessionId: string;
    magistratId: string | undefined;
    excludeObservationId: string | undefined;
  }): Promise<ListedObservationsAttachmentsDto> {
    return this.listObservationsAttachmentsQuery.handle(query);
  }
}
