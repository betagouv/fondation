import { Propagation, Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { assertNever } from '../../../utils/assert-never';
import { fileIdsReferencedIn } from '../../../utils/rich-text-html';
import { Clock } from '../../framework/clock';
import { Db } from '../../framework/database';
import {
  HelpPage,
  HelpPageContentWritten,
  type HelpPageEnum,
  IncludedFilesInHelpPageContent,
} from '../domain/help-page';

@Injectable()
export class HelpPageRepository {
  constructor(
    private readonly clock: Clock,
    private readonly db: Db,
  ) {}

  find(query: { page: HelpPageEnum }): HelpPage {
    return HelpPage.from(query);
  }

  @Transactional(Propagation.Mandatory)
  async persist(helpPage: HelpPage): Promise<void> {
    for (const message of helpPage.messages) {
      if (message instanceof HelpPageContentWritten) await this.persistHelpPageContentWritten(message);
      else if (message instanceof IncludedFilesInHelpPageContent)
        await this.persistIncludedFilesInHelpPageContent(message);
      else assertNever(message);
    }
  }

  private async persistHelpPageContentWritten(message: HelpPageContentWritten) {
    await this.db.tx.helpPage.update({
      data: { content: message.content, updatedById: message.editorId },
      where: { page: message.page },
    });
    await this.markScreenshotsAbsentFrom(message);
  }

  // a screenshot leaves with the text that embedded it and comes back with it, an undo included
  private async markScreenshotsAbsentFrom(message: { content: string; page: HelpPageEnum }) {
    const embedded = [...fileIdsReferencedIn(message.content)];

    await this.db.tx.helpPageScreenshot.updateMany({
      data: { detachedAt: this.clock.now() },
      where: { detachedAt: null, fileId: { notIn: embedded }, page: message.page },
    });
    await this.db.tx.helpPageScreenshot.updateMany({
      data: { detachedAt: null },
      where: { detachedAt: { not: null }, fileId: { in: embedded }, page: message.page },
    });
  }

  // the page itself is untouched: its date and its author are those of its last writing
  private persistIncludedFilesInHelpPageContent(message: IncludedFilesInHelpPageContent) {
    return this.db.tx.helpPageScreenshot.createMany({
      data: message.fileIds.map((fileId) => ({ fileId, page: message.page })),
    });
  }
}
