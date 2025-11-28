import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/modules/framework/database';

@Injectable()
export class GetCommentAccessQuery {
  constructor(private readonly prisma: PrismaService) {}

  async handle(query: {
    sessionId: string;
    nominationFileId: string;
  }): Promise<{ userIds: string[] }> {
    const accesses = await this.prisma.commentAccess.findMany({
      where: {
        nominationFileId: query.nominationFileId,
        nominationFile: {
          sessionId: query.sessionId,
        },
      },
      select: {
        userId: true,
      },
    });

    return {
      userIds: accesses.map((a) => a.userId),
    };
  }
}
