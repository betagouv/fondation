import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/framework/database';
import { Files } from 'src/modules/framework/files';
import {
  FILE_MIME_TYPES,
  filenameToMimeType,
} from 'src/modules/framework/files/mime-type';
import { SimpleAuthService } from 'src/modules/simple-auth';
import { isDefined } from 'src/utils/is-defined';
import { ignoreAsync } from 'src/utils/promises';
import { Summary } from '../domain/summary';
import { IncludedFilesInSummaryContentDto } from './dtos/summary.dto';
import {
  DetailedSummaryDto,
  DetailSummaryQuery,
} from './queries/detail-summary.query';
import {
  GeneratedSummaryAttachmentPublicUrlDto,
  GetSummaryAttachmentUrlQuery,
} from './queries/get-summary-attachment-url.query';
import { SummaryRepository } from './repositories/summary.repository';

@Injectable()
export class SummaryService {
  constructor(
    private readonly summaryRepository: SummaryRepository,
    private readonly files: Files,
    private readonly prisma: PrismaService,
    private readonly users: SimpleAuthService,
    private readonly detailSummaryQuery: DetailSummaryQuery,
    private readonly generateAttachmentPublicUrlQuery: GetSummaryAttachmentUrlQuery,
  ) {}

  async create(command: {
    userId: string;
    sessionId: string;
    nominationFileId: string;
  }): Promise<{ id: string }> {
    const summaryAlreadyExists = await this.summaryRepository.exists(command);
    if (summaryAlreadyExists) throw new ConflictException();

    const summary = Summary.create({
      authorId: command.userId,
      sessionId: command.sessionId,
      nominationFileId: command.nominationFileId,
    });

    await this.summaryRepository.persist(summary);
    return { id: summary.id };
  }

  async attachFiles(command: {
    sessionId: string;
    nominationFileId: string;
    fileIds: readonly string[];
  }): Promise<void> {
    const summary = await this.summaryRepository.find(command);
    summary.attachFiles(command);
    await this.summaryRepository.persist(summary);
  }

  async detachFiles(command: {
    sessionId: string;
    nominationFileId: string;
    fileIds: readonly string[];
  }): Promise<void> {
    const summary = await this.summaryRepository.find(command);
    summary.detachFiles(command);
    await this.summaryRepository.persist(summary);

    ignoreAsync(async () => {
      const files = await this.prisma.file.findMany({
        select: { path: true },
        where: { id: { in: command.fileIds as string[] } },
      });

      await this.files.delete(files.map((file) => file.path.join('/')));
    });
  }

  async includeFilesIntoContent(command: {
    sessionId: string;
    nominationFileId: string;
    files: readonly { id: string; name: string }[];
  }): Promise<IncludedFilesInSummaryContentDto> {
    const summary = await this.summaryRepository.find(command);
    summary.includeFilesIntoContent({
      fileIds: command.files.map(({ id }) => id),
    });
    await this.summaryRepository.persist(summary);

    const urls = await this.files.getPublicUrls(
      command.files.map(({ id }) => id),
    );
    const items = Object.entries(urls)
      .map(([id, url]) => {
        const existingFile = command.files.find((f) => f.id === id);
        if (!existingFile) return undefined;

        return {
          id,
          url: url.toString(),
          name: existingFile.name,
          type: filenameToMimeType(existingFile.name) ?? FILE_MIME_TYPES.bin,
        };
      })
      .filter(isDefined);

    return { items };
  }

  async writeContent(command: {
    userId: string;
    sessionId: string;
    nominationFileId: string;
    content: string;
  }): Promise<void> {
    const summary = await this.summaryRepository.find(command);
    summary.writeContent(command);
    await this.summaryRepository.persist(summary);
  }

  async updateReadersList(command: {
    userId: string;
    sessionId: string;
    nominationFileId: string;
    readerIds: readonly string[];
  }): Promise<void> {
    const summary = await this.summaryRepository.find(command);
    const { items: availableUsers } = await this.users.listUsers({
      excludeIds: [command.userId],
      includeIds: command.readerIds,
      includeIdsOnly: true,
    });
    summary.updateReadersList({
      readerIds: command.readerIds,
      availableUserIds: new Set(availableUsers.map(({ id }) => id)),
    });

    await this.summaryRepository.persist(summary);
  }

  detailSummary(query: {
    userId: string;
    sessionId: string;
    nominationFileId: string;
  }): Promise<DetailedSummaryDto> {
    return this.detailSummaryQuery.handle(query);
  }

  generateSummaryAttachmentPublicUrl(query: {
    sessionId: string;
    nominationFileId: string;
    fileId: string;
    userId: string;
  }): Promise<GeneratedSummaryAttachmentPublicUrlDto> {
    return this.generateAttachmentPublicUrlQuery.handle(query);
  }
}
