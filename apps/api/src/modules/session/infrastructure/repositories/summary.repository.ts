import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/modules/framework/database';
import { assertNever } from 'src/utils/assert-never';
import {
  AttachedFilesToSummary,
  DetachedFilesFromSummary,
  IncludedFilesInSummaryContent,
  Summary,
  SummaryContentWritten,
  SummaryCreated,
  UpdatedSummaryReaderList,
} from '../../domain/summary';
import { isDefined } from 'src/utils/is-defined';

@Injectable()
export class SummaryRepository {
  constructor(private readonly prisma: PrismaService) {}

  // TODO: should we rehydrate files with outcomes?
  async find(query: { sessionId: string; nominationFileId: string }) {
    const session = await this.prisma.session.findUnique({
      where: { id: query.sessionId },
      select: {
        dossierDeNominations: {
          where: { id: query.nominationFileId },
          select: {
            summary: {
              select: { nominationFileId: true, authorId: true },
            },
          },
        },
      },
    });

    const summary = session?.dossierDeNominations[0]?.summary;
    if (!isDefined(summary)) throw new NotFoundException();

    return Summary.from({
      id: summary.nominationFileId,
      authorId: summary.authorId,
    });
  }

  persist(summary: Summary) {
    return this.prisma.$transaction(
      summary.messages.map((message) => {
        if (message instanceof SummaryCreated)
          return this.persistSummaryCreated(message);
        else if (message instanceof AttachedFilesToSummary)
          return this.persistAttachedFilesToSummary(message);
        else if (message instanceof DetachedFilesFromSummary)
          return this.persistDetachedFilesFromSummary(message);
        else if (message instanceof IncludedFilesInSummaryContent)
          return this.persistIncludedFilesInSummaryContent(message);
        else if (message instanceof SummaryContentWritten)
          return this.persistSummaryContentWritten(message);
        else if (message instanceof UpdatedSummaryReaderList)
          return this.persistUpdatedSummaryReaderList(message);
        else return assertNever(message);
      }),
    );
  }

  private persistSummaryCreated(message: SummaryCreated) {
    return this.prisma.dossierDeNomination.update({
      where: { id: message.nominationFileId },
      data: { summary: { create: { content: '' } } },
    });
  }

  private persistAttachedFilesToSummary(message: AttachedFilesToSummary) {
    return this.prisma.summary.update({
      where: { nominationFileId: message.id },
      data: {
        attachments: {
          createMany: { data: message.fileIds.map((fileId) => ({ fileId })) },
        },
      },
    });
  }

  private persistDetachedFilesFromSummary(message: DetachedFilesFromSummary) {
    return this.prisma.summary.update({
      where: { nominationFileId: message.id },
      data: {
        attachments: {
          deleteMany: {
            fileId: { in: message.fileIds as string[] },
          },
        },
      },
    });
  }

  private persistIncludedFilesInSummaryContent(
    message: IncludedFilesInSummaryContent,
  ) {
    return this.prisma.summary.update({
      where: { nominationFileId: message.id },
      data: {
        screenshots: {
          createMany: { data: message.fileIds.map((fileId) => ({ fileId })) },
        },
      },
    });
  }

  private persistSummaryContentWritten(message: SummaryContentWritten) {
    return this.prisma.summary.update({
      where: { nominationFileId: message.id },
      data: { content: message.content },
    });
  }

  private persistUpdatedSummaryReaderList(message: UpdatedSummaryReaderList) {
    return this.prisma.summary.update({
      where: { nominationFileId: message.id },
      data: {
        readers: {
          updateMany: {
            where: {},
            data: message.readerIds.map((userId) => ({ userId })),
          },
        },
      },
    });
  }
}
