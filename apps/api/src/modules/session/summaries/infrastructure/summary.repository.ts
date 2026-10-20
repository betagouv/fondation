import { Propagation, Transactional } from '@nestjs-cls/transactional';
import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';

import { Prisma } from 'src/generated/prisma/client';
import { Db } from 'src/modules/framework/database';
import { Files } from 'src/modules/framework/files';
import {
  AttachedFilesToSummary,
  DetachedFilesFromSummary,
  IncludedFilesInSummaryContent,
  Summary,
  SummaryContentWritten,
  SummaryCreated,
  UpdatedSummaryReaderList,
} from 'src/modules/session/summaries/domain/summary';
import { TransparenceService } from 'src/modules/session/transparence/infrastructure/transparence.service';
import { assertNever } from 'src/utils/assert-never';

@Injectable()
export class SummaryRepository {
  constructor(
    private readonly db: Db,
    private readonly files: Files,
    @Inject(forwardRef(() => TransparenceService))
    private readonly sessions: TransparenceService,
  ) {}

  async isSessionArchived(query: { sessionId: string }): Promise<boolean> {
    const state = await this.sessions.internalFindSessionState(query);
    if (state === 'DELETED') throw new NotFoundException();

    return state === 'ARCHIVED';
  }

  async find(query: { sessionId: string; nominationFileId: string }) {
    const sessionIsArchived = await this.isSessionArchived(query);
    const summary = await this.db.tx.summary.findUnique({
      where: { nominationFileId: query.nominationFileId, nominationFile: { sessionId: query.sessionId } },
      select: { authorId: true, nominationFileId: true } satisfies Prisma.SummarySelect,
    });
    if (!summary) throw new NotFoundException();

    return Summary.from({
      authorId: summary.authorId,
      id: summary.nominationFileId,
      sessionId: query.sessionId,
      sessionIsArchived,
    });
  }

  @Transactional(Propagation.Mandatory)
  async persist(summary: Summary) {
    for (const message of summary.messages) {
      if (message instanceof SummaryCreated) await this.persistSummaryCreated(message);
      else if (message instanceof AttachedFilesToSummary) await this.persistAttachedFilesToSummary(message);
      else if (message instanceof DetachedFilesFromSummary)
        await this.persistDetachedFilesFromSummary(message);
      else if (message instanceof IncludedFilesInSummaryContent)
        await this.persistIncludedFilesInSummaryContent(message);
      else if (message instanceof SummaryContentWritten) await this.persistSummaryContentWritten(message);
      else if (message instanceof UpdatedSummaryReaderList)
        await this.persistUpdatedSummaryReaderList(message);
      else assertNever(message);
    }
  }

  private persistSummaryCreated(message: SummaryCreated) {
    return this.db.tx.dossierDeNomination.update({
      where: { id: message.nominationFileId, sessionId: message.sessionId },
      data: {
        summary: { upsert: { create: { content: '' }, update: {} } },
      },
    });
  }

  private persistAttachedFilesToSummary(message: AttachedFilesToSummary) {
    return this.db.tx.summary.update({
      where: { nominationFileId: message.id },
      data: {
        attachments: {
          createMany: { data: message.fileIds.map((fileId) => ({ fileId })) },
        },
      },
    });
  }

  private async persistDetachedFilesFromSummary(message: DetachedFilesFromSummary) {
    // a file attached elsewhere is not this summary's to delete
    const where = { fileId: { in: [...message.fileIds] }, summaryId: message.id };
    const attachments = await this.db.tx.summaryAttachment.findMany({
      where,
      select: { file: { select: { id: true, path: true } } } satisfies Prisma.SummaryAttachmentSelect,
    });

    await this.db.tx.summaryAttachment.deleteMany({ where });

    this.files.delete(attachments.map(({ file }) => file));
  }

  private persistIncludedFilesInSummaryContent(message: IncludedFilesInSummaryContent) {
    return this.db.tx.summary.update({
      where: { nominationFileId: message.id },
      data: {
        screenshots: {
          createMany: { data: message.fileIds.map((fileId) => ({ fileId })) },
        },
      },
    });
  }

  private persistSummaryContentWritten(message: SummaryContentWritten) {
    return this.db.tx.summary.update({
      where: { nominationFileId: message.id },
      data: {
        content: message.content,
        ...(message.newAuthorId ? { authorId: message.newAuthorId } : {}),
      },
    });
  }

  private persistUpdatedSummaryReaderList(message: UpdatedSummaryReaderList) {
    return this.db.tx.summary.update({
      where: { nominationFileId: message.id },
      data: {
        readers: {
          deleteMany: {},
          createMany: { data: message.readerIds.map((userId) => ({ userId })) },
        },
      },
    });
  }
}
