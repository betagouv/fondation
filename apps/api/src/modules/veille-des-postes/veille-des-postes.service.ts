import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import type { DateOnly } from '../../utils/date-only';
import { Pagination } from '../framework/pagination';
import { Sortable } from '../framework/sorting';

import type { CourtOfCassationPosition } from './domain/court-of-cassation-position';
import type { AlertDeadline, PositionAlert } from './domain/position-alert';
import type { PositionStatus } from './domain/position-status';
import type { VacancyReason } from './domain/position-vacancy';
import type {
  ListCourtOfAppealFirstPresidentsDto,
  ListCourtOfCassationHoldersDto,
  ListJudicialCourtPresidentsDto,
} from './infrastructure/dtos/veille-des-postes.dto';
import {
  FindPositionCommentQuery,
  FoundPositionCommentDto,
} from './infrastructure/queries/find-position-comment.query';
import {
  FindPositionVacancyQuery,
  FoundPositionVacancyDto,
} from './infrastructure/queries/find-position-vacancy.query';
import {
  ListCourtOfAppealFirstPresidentsQuery,
  ListedCourtOfAppealFirstPresidentsDto,
} from './infrastructure/queries/list-court-of-appeal-first-presidents.query';
import {
  ListCourtOfCassationHoldersQuery,
  ListedCourtOfCassationHoldersDto,
} from './infrastructure/queries/list-court-of-cassation-holders.query';
import {
  ListedJudicialCourtPresidentsDto,
  ListJudicialCourtPresidentsQuery,
} from './infrastructure/queries/list-judicial-court-presidents.query';
import {
  OpenedPositionVacancyAttachmentDto,
  OpenPositionVacancyAttachmentQuery,
} from './infrastructure/queries/open-position-vacancy-attachment.query';
import { PositionCommentRepository } from './infrastructure/repositories/position-comment.repository';
import { PositionVacancyRepository } from './infrastructure/repositories/position-vacancy.repository';

type StatusAndAlertFilters = {
  alerts: readonly PositionAlert[];
  deadlines: readonly AlertDeadline[];
  pagination: Pagination;
  search: string | undefined;
  statuses: readonly PositionStatus[];
};

@Injectable()
export class VeilleDesPostesService {
  constructor(
    private readonly comments: PositionCommentRepository,
    private readonly findPositionCommentQuery: FindPositionCommentQuery,
    private readonly findPositionVacancyQuery: FindPositionVacancyQuery,
    private readonly listCourtOfAppealFirstPresidentsQuery: ListCourtOfAppealFirstPresidentsQuery,
    private readonly listCourtOfCassationHoldersQuery: ListCourtOfCassationHoldersQuery,
    private readonly listJudicialCourtPresidentsQuery: ListJudicialCourtPresidentsQuery,
    private readonly openPositionVacancyAttachmentQuery: OpenPositionVacancyAttachmentQuery,
    private readonly vacancies: PositionVacancyRepository,
  ) {}

  @Transactional()
  async declarePositionVacancy(command: {
    authorId: string;
    files: readonly { id: string }[];
    magistratId: string;
    reason: VacancyReason;
    reasonDetail: string | null;
    startDate: DateOnly;
  }): Promise<void> {
    const vacancy = await this.vacancies.find(command);
    vacancy.declare({ ...command, fileIds: command.files.map(({ id }) => id) });
    await this.vacancies.persist(vacancy);
  }

  findCourtComment(query: { courtId: string }): Promise<FoundPositionCommentDto> {
    return this.findPositionCommentQuery.handle(query);
  }

  findPositionComment(query: { magistratId: string }): Promise<FoundPositionCommentDto> {
    return this.findPositionCommentQuery.handle(query);
  }

  findPositionVacancy(query: { magistratId: string }): Promise<FoundPositionVacancyDto> {
    return this.findPositionVacancyQuery.handle(query);
  }

  listCourtOfAppealFirstPresidents(
    query: StatusAndAlertFilters & { sorting: Sortable<ListCourtOfAppealFirstPresidentsDto> },
  ): Promise<ListedCourtOfAppealFirstPresidentsDto> {
    return this.listCourtOfAppealFirstPresidentsQuery.handle(query);
  }

  listCourtOfCassationHolders(
    query: StatusAndAlertFilters & {
      positions: readonly CourtOfCassationPosition[];
      sorting: Sortable<ListCourtOfCassationHoldersDto>;
    },
  ): Promise<ListedCourtOfCassationHoldersDto> {
    return this.listCourtOfCassationHoldersQuery.handle(query);
  }

  listJudicialCourtPresidents(
    query: StatusAndAlertFilters & {
      ressorts: readonly string[];
      sorting: Sortable<ListJudicialCourtPresidentsDto>;
    },
  ): Promise<ListedJudicialCourtPresidentsDto> {
    return this.listJudicialCourtPresidentsQuery.handle(query);
  }

  openPositionVacancyAttachment(query: {
    fileId: string;
    magistratId: string;
  }): Promise<OpenedPositionVacancyAttachmentDto> {
    return this.openPositionVacancyAttachmentQuery.handle(query);
  }

  @Transactional()
  async removePositionVacancyAttachment(command: { fileId: string; magistratId: string }): Promise<void> {
    const vacancy = await this.vacancies.find(command);
    vacancy.removeAttachment(command.fileId);
    await this.vacancies.persist(vacancy);
  }

  @Transactional()
  async renamePositionVacancyAttachment(command: {
    fileId: string;
    magistratId: string;
    name: string;
  }): Promise<void> {
    const vacancy = await this.vacancies.find(command);
    vacancy.renameAttachment(command.fileId, command.name);
    await this.vacancies.persist(vacancy);
  }

  @Transactional()
  async withdrawPositionVacancy(command: { magistratId: string }): Promise<void> {
    const vacancy = await this.vacancies.find(command);
    vacancy.withdraw();
    await this.vacancies.persist(vacancy);
  }

  @Transactional()
  async writeCourtComment(command: { authorId: string; comment: string; courtId: string }): Promise<void> {
    const comment = await this.comments.findOfCourt(command);
    comment.write(command);
    await this.comments.persist(comment);
  }

  @Transactional()
  async writePositionComment(command: {
    authorId: string;
    comment: string;
    magistratId: string;
  }): Promise<void> {
    const comment = await this.comments.findOfHolder(command);
    comment.write(command);
    await this.comments.persist(comment);
  }
}
