import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { isDefined } from '../../utils/is-defined';
import { Db } from '../framework/database';
import { Files } from '../framework/files';
import type { RoleEnum } from '../shared/role.enum';

import { helpPageOf, type HelpPageEnum } from './domain/help-page';
import { HelpPageRepository } from './infrastructure/help-page.repository';
import { IncludedFilesInHelpPageContentDto } from './infrastructure/help.dto';
import { DetailedHelpPageDto, DetailHelpPageQuery } from './infrastructure/queries/detail-help-page.query';

@Injectable()
export class HelpService {
  constructor(
    private readonly db: Db,
    private readonly detailHelpPageQuery: DetailHelpPageQuery,
    private readonly files: Files,
    private readonly helpPageRepository: HelpPageRepository,
  ) {}

  @Transactional()
  detailHelpPage(query: { page: HelpPageEnum; user: { role: RoleEnum } }): Promise<DetailedHelpPageDto> {
    return this.detailHelpPageQuery.handle(query);
  }

  @Transactional()
  detailReaderHelpPage(query: { user: { role: RoleEnum } }): Promise<DetailedHelpPageDto> {
    return this.detailHelpPageQuery.handle({ page: helpPageOf(query.user), user: query.user });
  }

  async includeFilesIntoContent(command: {
    files: readonly { id: string; name: string }[];
    page: HelpPageEnum;
  }): Promise<IncludedFilesInHelpPageContentDto> {
    await this.db.withTransaction(async () => {
      const helpPage = this.helpPageRepository.find(command);
      helpPage.includeFilesIntoContent({ fileIds: command.files.map(({ id }) => id) });
      await this.helpPageRepository.persist(helpPage);
    });

    const urls = await this.files.getPublicUrls(command.files.map(({ id }) => id));
    const items = Object.entries(urls)
      .map(([id, url]) => {
        const file = command.files.find((f) => f.id === id);
        if (!file) return undefined;

        return {
          id,
          name: file.name,
          url: url.toString(),
        };
      })
      .filter(isDefined);

    return { items };
  }

  @Transactional()
  async writeContent(command: { content: string; editorId: string; page: HelpPageEnum }): Promise<void> {
    const helpPage = this.helpPageRepository.find(command);
    helpPage.writeContent(command);
    await this.helpPageRepository.persist(helpPage);
  }
}
