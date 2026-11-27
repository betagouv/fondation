import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { Pagination } from '../framework/pagination';
import { Sortable } from '../framework/sorting';

import { normalizedEmail } from './domain/unrecognised-magistrat-email';
import {
  MagistratProfilesFinder,
  type MagistratProfile,
} from './infrastructure/finders/magistrat-profiles.finder';
import { DetailedMagistratDto, DetailMagistratQuery } from './infrastructure/queries/detail-magistrat.query';
import {
  FindMagistratStatusQuery,
  FoundMagistratStatusDto,
} from './infrastructure/queries/find-magistrat-status.query';
import {
  IdentifiedMagistratDto,
  IdentifyMagistratQuery,
} from './infrastructure/queries/identify-magistrat.query';
import {
  ListedMagistratAttachedEmailsDto,
  ListMagistratAttachedEmailsQuery,
} from './infrastructure/queries/list-magistrat-attached-emails.query';
import {
  ListedMagistratPhoneNumbersDto,
  ListMagistratPhoneNumbersQuery,
} from './infrastructure/queries/list-magistrat-phone-numbers.query';
import {
  ListedUnrecognisedMagistratEmailsDto,
  ListUnrecognisedMagistratEmailsQuery,
  type UnrecognisedMagistratEmailsSortableColumn,
} from './infrastructure/queries/list-unrecognised-magistrat-emails.query';
import {
  SearchMagistratsQuery,
  SearchMagistratsResponseDto,
} from './infrastructure/queries/search-magistrats.query';
import { AttachedMagistratEmailRepository } from './infrastructure/repositories/attached-magistrat-email.repository';
import { MagistratPhoneNumbersRepository } from './infrastructure/repositories/magistrat-phone-numbers.repository';
import { UnrecognisedMagistratEmailRepository } from './infrastructure/repositories/unrecognised-magistrat-email.repository';

@Injectable()
export class MagistratService {
  constructor(
    private readonly attachedMagistratEmailRepository: AttachedMagistratEmailRepository,
    private readonly detailMagistratQuery: DetailMagistratQuery,
    private readonly findMagistratStatusQuery: FindMagistratStatusQuery,
    private readonly identifyMagistratQuery: IdentifyMagistratQuery,
    private readonly listMagistratAttachedEmailsQuery: ListMagistratAttachedEmailsQuery,
    private readonly listMagistratPhoneNumbersQuery: ListMagistratPhoneNumbersQuery,
    private readonly listUnrecognisedMagistratEmailsQuery: ListUnrecognisedMagistratEmailsQuery,
    private readonly magistratPhoneNumbersRepository: MagistratPhoneNumbersRepository,
    private readonly magistratProfiles: MagistratProfilesFinder,
    private readonly searchMagistratsQuery: SearchMagistratsQuery,
    private readonly unrecognisedMagistratEmailRepository: UnrecognisedMagistratEmailRepository,
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

  findMagistratStatus(query: { magistratId: string }): Promise<FoundMagistratStatusDto> {
    return this.findMagistratStatusQuery.handle(query);
  }

  @Transactional()
  async identifyMagistrat(command: { email: string }): Promise<IdentifiedMagistratDto> {
    const email = normalizedEmail(command.email);
    const identified = await this.identifyMagistratQuery.handle({ email });
    if (identified.status === 'UNKNOWN') await this.unrecognisedMagistratEmailRepository.record({ email });

    return identified;
  }

  @Transactional()
  forgetOldUnrecognisedEmails(): Promise<number> {
    return this.unrecognisedMagistratEmailRepository.forgetOld();
  }

  listUnrecognisedEmails(query: {
    pagination: Pagination;
    sorting: Sortable<UnrecognisedMagistratEmailsSortableColumn>;
  }): Promise<ListedUnrecognisedMagistratEmailsDto> {
    return this.listUnrecognisedMagistratEmailsQuery.handle(query);
  }

  @Transactional()
  async attachUnrecognisedEmail(command: {
    authorId: string;
    id: string;
    magistratId: string;
  }): Promise<void> {
    const email = await this.unrecognisedMagistratEmailRepository.find({ id: command.id });
    email.attachTo({
      authorId: command.authorId,
      magistrat: await this.unrecognisedMagistratEmailRepository.findMagistrat({ id: command.magistratId }),
    });
    await this.unrecognisedMagistratEmailRepository.persist(email);
  }

  listAttachedEmails(query: { magistratId: string }): Promise<ListedMagistratAttachedEmailsDto> {
    return this.listMagistratAttachedEmailsQuery.handle(query);
  }

  @Transactional()
  async detachEmail(command: { id: string; magistratId: string }): Promise<void> {
    const email = await this.attachedMagistratEmailRepository.find(command);
    email.detach();
    await this.attachedMagistratEmailRepository.persist(email);
  }

  @Transactional()
  async dismissUnrecognisedEmail(command: { id: string }): Promise<void> {
    const email = await this.unrecognisedMagistratEmailRepository.find(command);
    email.dismiss();
    await this.unrecognisedMagistratEmailRepository.persist(email);
  }
}
