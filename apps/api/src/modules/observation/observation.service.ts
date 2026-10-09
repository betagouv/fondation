import { Transactional } from '@nestjs-cls/transactional';
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
import { Prisma } from 'src/generated/prisma/client';
import { Db } from 'src/modules/framework/database';
import { Files } from 'src/modules/framework/files';
import type { StoredFile } from 'src/modules/framework/files/multipart/multipart.types';
import type { RoleEnum } from 'src/modules/shared/role.enum';
import type { AuditionSchedule } from 'src/utils/audition-schedule';
import type { DateOnly } from 'src/utils/date-only';
import { isDefined } from 'src/utils/is-defined';
import type { TimeOnly } from 'src/utils/time-only';

import {
  Observation,
  UserNotAllowedToAttachScreenshotsError,
  UserNotAllowedToWriteCommentError,
} from './domain/observation';
import { AttachedMemberCommentScreenshotsDto } from './infrastructure/dtos/observation-member-comment.dto';
import {
  type NominationFileObservation,
  NominationFileObservationsFinder,
} from './infrastructure/finders/nomination-file-observations.finder';
import {
  ObservantAuditionsFinder,
  type ObservantAuditionWithObservations,
} from './infrastructure/finders/observant-auditions.finder';
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
import { ObservantAuditionRepository } from './infrastructure/repositories/observant-audition.repository';
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
    private readonly nominationFileObservationsFinder: NominationFileObservationsFinder,
    private readonly observantAuditionRepository: ObservantAuditionRepository,
    private readonly observantAuditions: ObservantAuditionsFinder,

    @Inject(forwardRef(() => TransparenceService))
    private readonly transparences: TransparenceService,
  ) {}

  @Transactional()
  async createObservation(command: {
    dateReception: Date;
    description: string | undefined | null;
    files: readonly { id: string }[];
    magistratId: string;
    nominationFileId: string;
    sessionId: string;
    userId: string;
    linkedAttachments: readonly {
      fileId: string;
      observationId: string;
    }[];
  }): Promise<{ id: string }> {
    const nominationFile = await this.observationFinder.findExistingObservation({
      magistratId: command.magistratId,
      nominationFileId: command.nominationFileId,
      sessionId: command.sessionId,
    });
    const { items: linkedFiles } = await this.observationFinder.findExistingFiles({
      files: command.linkedAttachments.map((attachment) => ({
        ...attachment,
        magistratId: command.magistratId,
      })),
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
      createdByUserId: command.userId,
      dateReception: command.dateReception,
      description: command.description,
      files: command.files,
      linkedFiles,
      magistratId: command.magistratId,
      nominationFile,
      sessionId: command.sessionId,
    });

    await this.observationRepository.persist(observation);

    return { id: observation.id };
  }

  @Transactional()
  async deleteObservation(command: {
    impersonatorId: string | null;
    observationId: string;
    userId: string;
  }): Promise<void> {
    const observation = await this.observationRepository.findById(command.observationId);

    observation.delete({
      ...command,
      isLastOfObservant: await this.observationRepository.isLastOfObservant(observation),
    });
    await this.observationRepository.persist(observation);
  }

  @Transactional()
  async updateObservation(command: {
    dateReception: Date;
    description: string | null | undefined;
    fileIdsToDetach: readonly string[];
    filesToAttach: readonly { id: string }[];
    impersonatorId: string | null;
    linkedFiles: readonly { fileId: string; observationId: string }[];
    magistratId: string;
    observationId: string;
    userId: string;
  }): Promise<void> {
    const observation = await this.observationRepository.findById(command.observationId);

    if (command.magistratId !== observation.magistratId) {
      const existingObservation = await this.db.tx.observation.findUnique({
        select: { id: true } satisfies Prisma.ObservationSelect,
        where: {
          nominationFileId_magistratId: {
            magistratId: command.magistratId,
            nominationFileId: observation.nominationFileId,
          },
        },
      });

      if (existingObservation) {
        throw new ConflictException(
          'Une observation de ce magistrat existe déjà pour ce dossier de nomination',
        );
      }
    }

    observation.update({
      dateReception: command.dateReception,
      description: command.description,
      impersonatorId: command.impersonatorId,
      isLastOfObservant: await this.observationRepository.isLastOfObservant(observation),
      magistratId: command.magistratId,
      userId: command.userId,
    });
    observation.attachFiles({ files: command.filesToAttach });
    observation.detachFiles({ fileIds: command.fileIdsToDetach });
    observation.linkFiles({ files: command.linkedFiles });

    await this.observationRepository.persist(observation);
  }

  /** @internal */
  internalFindNominationFilesObservations(query: {
    nominationFileIds: ReadonlySet<string>;
    userId: string;
  }): Promise<Map<string, NominationFileObservation[]>> {
    return this.nominationFileObservationsFinder.find(query);
  }

  /** @internal */
  internalFindMagistratObservations(query: {
    magistratId: string;
  }): Promise<{ dateReception: Date; id: string; nominationFileId: string }[]> {
    return this.nominationFileObservationsFinder.received(query);
  }

  /** @internal */
  internalFindNominationFilesObservants(query: {
    nominationFileIds: ReadonlySet<string>;
  }): Promise<Map<string, { firstName: string; id: string; lastName: string; usedName: string | null }[]>> {
    return this.nominationFileObservationsFinder.observants(query);
  }

  /** @internal */
  internalListObservantAuditions(query: { sessionId: string }): Promise<ObservantAuditionWithObservations[]> {
    return this.observantAuditions.findWithObservations(query);
  }

  /** @internal */
  internalFindObservantObservations(query: {
    magistratIds: readonly string[];
    sessionId: string;
  }): Promise<Map<string, { nominationFileId: string; observationId: string }[]>> {
    return this.observantAuditions.findObservations(query);
  }

  /** @internal */
  internalFindObservantAuditions(predicate: {
    magistratIds?: readonly string[];
    sessionId: string;
  }): Promise<Map<string, AuditionSchedule>> {
    return this.observantAuditions.findByMagistratId(predicate);
  }

  @Transactional()
  async scheduleObservantAudition(command: {
    auditionDateTime: { date: DateOnly; time: TimeOnly } | null;
    impersonatorId: string | null;
    nominationFileId: string;
    observationId: string;
    sessionId: string;
    userId: string;
  }): Promise<void> {
    const audition = await this.observantAuditionRepository.findByObservation(command);
    if (command.auditionDateTime)
      audition.schedule({ ...command, auditionDateTime: command.auditionDateTime });
    else audition.unschedule(command);
    await this.observantAuditionRepository.persist(audition);
  }

  @Transactional()
  listObservations(query: {
    nominationFileId: string;
    role: RoleEnum;
    sessionId: string;
  }): Promise<ListObservationsResponseDto> {
    return this.listObservationsQuery.handle(query);
  }

  getObservationFileUrl(query: {
    fileId: string;
    observationId: string;
  }): Promise<GetObservationFileUrlResponseDto> {
    return this.getObservationFileUrlQuery.handle(query);
  }

  getObservationDetails(query: {
    nominationFileId: string;
    observationId: string;
    role: RoleEnum;
    sessionId: string;
    userId: string;
  }): Promise<GetObservationDetailsResponseDto> {
    return this.getObservationDetailsQuery.handle(query);
  }

  async attachMemberCommentScreenshots(command: {
    files: readonly StoredFile[];
    nominationFileId: string;
    observationId: string;
    sessionId: string;
    userId: string;
  }): Promise<AttachedMemberCommentScreenshotsDto> {
    await this.db.withTransaction(async () => {
      const reporters = await this.transparences.internalFindPublishedReporters({
        nominationFileIds: [command.nominationFileId],
      });
      const reporterIds = (reporters.get(command.nominationFileId) ?? []).map(({ id }) => id);

      const observation = await this.observationRepository.findById(command.observationId);

      try {
        observation.attachMemberCommentScreenshots({
          files: command.files.map((f) => ({ id: f.id })),
          reporterIds,
          userId: command.userId,
        });
      } catch (error) {
        if (error instanceof UserNotAllowedToAttachScreenshotsError) {
          throw new ForbiddenException();
        }
        throw error;
      }

      await this.observationRepository.persist(observation);
    });

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

  @Transactional()
  async writeMemberComment(command: {
    comment: string;
    nominationFileId: string;
    observationId: string;
    sessionId: string;
    userId: string;
  }): Promise<void> {
    const reporters = await this.transparences.internalFindPublishedReporters({
      nominationFileIds: [command.nominationFileId],
    });
    const reporterIds = (reporters.get(command.nominationFileId) ?? []).map(({ id }) => id);

    const observation = await this.observationRepository.findById(command.observationId);

    try {
      observation.writeMemberComment({
        comment: command.comment,
        reporterIds,
        userId: command.userId,
      });
    } catch (error) {
      if (error instanceof UserNotAllowedToWriteCommentError) {
        throw new ForbiddenException();
      }
      throw error;
    }

    await this.observationRepository.persist(observation);
  }

  @Transactional()
  async followUpWith(command: {
    comment: string | null;
    followUp: string | null;
    observationId: string;
    userId: string | null;
  }): Promise<void> {
    const observation = await this.observationRepository.findById(command.observationId);
    observation.followUpWith(command);
    await this.observationRepository.persist(observation);
  }

  listObservationsAttachments(query: {
    excludeObservationId: string | undefined;
    magistratId: string | undefined;
    sessionId: string;
  }): Promise<ListedObservationsAttachmentsDto> {
    return this.listObservationsAttachmentsQuery.handle(query);
  }
}
