import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/framework/database';
import { isDefined } from 'src/utils/is-defined';

@Injectable()
export class NominationSessionFileFinder {
  constructor(private readonly prisma: PrismaService) {}

  async bySessionAndFileNumber(query: {
    sessionId: string;
    fileNumbers: readonly number[];
  }): Promise<{ id: string; fileNumber: number }[]> {
    const files = await this.prisma.dossierDeNomination.findMany({
      where: {
        sessionId: query.sessionId,
        number: { in: query.fileNumbers as number[] },
      },
      select: { id: true, number: true },
    });

    return files
      .filter((x): x is { id: string; number: number } => isDefined(x.number))
      .map(({ id, number: fileNumber }) => ({ id, fileNumber }));
  }
}
