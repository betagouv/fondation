import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { Summary } from '../domain/summary';
import { Db } from 'src/modules/framework/database';
import { Files } from 'src/modules/framework/files';
import { FILE_MIME_TYPES, filenameToMimeType } from 'src/modules/framework/files/mime-type';
import type { RoleEnum } from 'src/modules/shared/role.enum';
import { SimpleAuthService } from 'src/modules/simple-auth';
import { isDefined } from 'src/utils/is-defined';

import { DetailedSummaryDto, DetailSummaryQuery } from './queries/detail-summary.query';
import {
  GeneratedSummaryAttachmentPublicUrlDto,
  GetSummaryAttachmentUrlQuery,
} from './queries/get-summary-attachment-url.query';
import { IncludedFilesInSummaryContentDto } from './summary.dto';
import { SummaryRepository } from './summary.repository';

@Injectable()
export class SummaryService {
  constructor(
    private readonly summaryRepository: SummaryRepository,
    private readonly files: Files,
    private readonly db: Db,
    private readonly users: SimpleAuthService,
    private readonly detailSummaryQuery: DetailSummaryQuery,
    private readonly generateAttachmentPublicUrlQuery: GetSummaryAttachmentUrlQuery,
  ) {}

  @Transactional()
  async create(command: { sessionId: string; nominationFileId: string }): Promise<{ id: string }> {
    const summary = Summary.create(command);
    await this.summaryRepository.persist(summary);
    return { id: summary.id };
  }

  @Transactional()
  async attachFiles(command: {
    fileIds: readonly string[];
    nominationFileId: string;
    sessionId: string;
  }): Promise<void> {
    const summary = await this.summaryRepository.find(command);
    summary.attachFiles(command);
    await this.summaryRepository.persist(summary);
  }

  @Transactional()
  async detachFiles(command: {
    fileIds: readonly string[];
    nominationFileId: string;
    sessionId: string;
  }): Promise<void> {
    const summary = await this.summaryRepository.find(command);
    summary.detachFiles(command);
    await this.summaryRepository.persist(summary);
  }

  async includeFilesIntoContent(command: {
    files: readonly { id: string; name: string }[];
    nominationFileId: string;
    sessionId: string;
  }): Promise<IncludedFilesInSummaryContentDto> {
    await this.db.withTransaction(async () => {
      const summary = await this.summaryRepository.find(command);
      summary.includeFilesIntoContent({
        fileIds: command.files.map(({ id }) => id),
      });
      await this.summaryRepository.persist(summary);
    });

    const urls = await this.files.getPublicUrls(command.files.map(({ id }) => id));
    const items = Object.entries(urls)
      .map(([id, url]) => {
        const existingFile = command.files.find((f) => f.id === id);
        if (!existingFile) return undefined;

        return {
          id,
          name: existingFile.name,
          type: filenameToMimeType(existingFile.name) ?? FILE_MIME_TYPES.bin,
          url: url.toString(),
        };
      })
      .filter(isDefined);

    return { items };
  }

  @Transactional()
  async writeContent(command: {
    content: string;
    nominationFileId: string;
    sessionId: string;
    userId: string;
  }): Promise<void> {
    const summary = await this.summaryRepository.find(command);
    summary.writeContent(command);
    await this.summaryRepository.persist(summary);
  }

  @Transactional()
  async updateReadersList(command: {
    nominationFileId: string;
    readerIds: readonly string[];
    sessionId: string;
    userId: string;
  }): Promise<void> {
    const summary = await this.summaryRepository.find(command);
    const { items: availableUsers } = await this.users.listUsers({
      excludeIds: [command.userId],
      includeIds: command.readerIds,
      includeIdsOnly: true,
    });
    summary.updateReadersList({
      availableUserIds: new Set(availableUsers.map(({ id }) => id)),
      readerIds: command.readerIds,
    });

    await this.summaryRepository.persist(summary);
  }

  @Transactional()
  detailSummary(query: {
    nominationFileId: string;
    role: RoleEnum;
    sessionId: string;
    userId: string;
  }): Promise<DetailedSummaryDto> {
    return this.detailSummaryQuery.handle(query);
  }

  generateSummaryAttachmentPublicUrl(query: {
    fileId: string;
    nominationFileId: string;
    sessionId: string;
    userId: string;
  }): Promise<GeneratedSummaryAttachmentPublicUrlDto> {
    return this.generateAttachmentPublicUrlQuery.handle(query);
  }
}
