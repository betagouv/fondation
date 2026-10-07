import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { Pagination } from 'src/modules/framework/pagination';
import type { RoleEnum } from 'src/modules/shared/role.enum';

import {
  MagistratProfilesFinder,
  type MagistratProfile,
} from './infrastructure/finders/magistrat-profiles.finder';
import { DetailedMagistratDto, DetailMagistratQuery } from './infrastructure/queries/detail-magistrat.query';
import {
  ListedMagistratNominationFilesDto,
  ListMagistratNominationFilesQuery,
} from './infrastructure/queries/list-magistrat-nomination-files.query';
import {
  ListedMagistratObservationsDto,
  ListMagistratObservationsQuery,
} from './infrastructure/queries/list-magistrat-observations.query';
import {
  ListedMagistratPhoneNumbersDto,
  ListMagistratPhoneNumbersQuery,
} from './infrastructure/queries/list-magistrat-phone-numbers.query';
import {
  SearchMagistratsQuery,
  SearchMagistratsResponseDto,
} from './infrastructure/queries/search-magistrats.query';
import { MagistratPhoneNumbersRepository } from './infrastructure/repositories/magistrat-phone-numbers.repository';

@Injectable()
export class MagistratService {
  constructor(
    private readonly detailMagistratQuery: DetailMagistratQuery,
    private readonly listMagistratNominationFilesQuery: ListMagistratNominationFilesQuery,
    private readonly listMagistratObservationsQuery: ListMagistratObservationsQuery,
    private readonly listMagistratPhoneNumbersQuery: ListMagistratPhoneNumbersQuery,
    private readonly magistratPhoneNumbersRepository: MagistratPhoneNumbersRepository,
    private readonly magistratProfiles: MagistratProfilesFinder,
    private readonly searchMagistratsQuery: SearchMagistratsQuery,
  ) {}

  /** @internal */
  internalFindMagistratProfiles(query: {
    magistratIds: readonly string[];
  }): Promise<Map<string, MagistratProfile>> {
    return this.magistratProfiles.findByMagistratId(query);
  }

  @Transactional()
  async addPhoneNumber(command: {
    authorId: string;
    label: string | null;
    magistratId: string;
    number: string;
  }): Promise<void> {
    const phoneNumbers = await this.magistratPhoneNumbersRepository.findByMagistratId(command);
    phoneNumbers.add({
      authorId: command.authorId,
      id: crypto.randomUUID(),
      label: command.label,
      number: command.number,
    });
    await this.magistratPhoneNumbersRepository.persist(phoneNumbers);
  }

  @Transactional()
  async updatePhoneNumber(command: {
    authorId: string;
    label: string | null;
    magistratId: string;
    number: string;
    phoneNumberId: string;
  }): Promise<void> {
    const phoneNumbers = await this.magistratPhoneNumbersRepository.findByMagistratId(command);
    phoneNumbers.update({
      authorId: command.authorId,
      id: command.phoneNumberId,
      label: command.label,
      number: command.number,
    });
    await this.magistratPhoneNumbersRepository.persist(phoneNumbers);
  }

  @Transactional()
  async deletePhoneNumber(command: { magistratId: string; phoneNumberId: string }): Promise<void> {
    const phoneNumbers = await this.magistratPhoneNumbersRepository.findByMagistratId(command);
    phoneNumbers.delete({ id: command.phoneNumberId });
    await this.magistratPhoneNumbersRepository.persist(phoneNumbers);
  }

  detailMagistrat(query: { magistratId: string }): Promise<DetailedMagistratDto> {
    return this.detailMagistratQuery.handle(query);
  }

  listNominationFiles(query: {
    magistratId: string;
    pagination: Pagination;
    role: RoleEnum;
  }): Promise<ListedMagistratNominationFilesDto> {
    return this.listMagistratNominationFilesQuery.handle(query);
  }

  listObservations(query: {
    magistratId: string;
    pagination: Pagination;
    role: RoleEnum;
  }): Promise<ListedMagistratObservationsDto> {
    return this.listMagistratObservationsQuery.handle(query);
  }

  listPhoneNumbers(query: { magistratId: string }): Promise<ListedMagistratPhoneNumbersDto> {
    return this.listMagistratPhoneNumbersQuery.handle(query);
  }

  searchMagistrats(query: {
    ignoreIds: readonly string[] | undefined;
    pagination: Pagination;
    search: string | undefined;
  }): Promise<SearchMagistratsResponseDto> {
    return this.searchMagistratsQuery.handle(query);
  }
}
