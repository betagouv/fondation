import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../framework/database/prisma.service';

@Injectable()
export class GetNominationFileWithCommentQuery {
  constructor(private readonly prisma: PrismaService) {}

  async handle(query: {
    sessionId: string;
    nominationFileId: string;
  }): Promise<{ comment: string | null; userIds: string[] }> {
    const nominationFile = await this.prisma.dossierDeNomination.findUnique({
      where: {
        id: query.nominationFileId,
        sessionId: query.sessionId,
      },
      select: {
        comment: true,
        commentAccess: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!nominationFile) {
      throw new Error(
        `Nomination file with id ${query.nominationFileId} not found in session ${query.sessionId}`,
      );
    }

    return {
      comment: nominationFile.comment,
      userIds: nominationFile.commentAccess.map((a) => a.userId),
    };
  }
}
