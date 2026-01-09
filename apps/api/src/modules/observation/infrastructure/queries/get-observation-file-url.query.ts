import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { PrismaService } from 'src/modules/framework/database';
import { Files } from 'src/modules/framework/files';

@Injectable()
export class GetObservationFileUrlQuery {
  constructor(
    private readonly prisma: PrismaService,
    private readonly files: Files,
  ) {}

  async handle(query: {
    observationId: string;
    fileId: string;
  }): Promise<GetObservationFileUrlResponseDto> {
    const observationFile = await this.prisma.observationFile.findUnique({
      where: {
        observationId_fileId: {
          observationId: query.observationId,
          fileId: query.fileId,
        },
      },
      select: {
        file: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!observationFile) throw new NotFoundException();

    const urlsRecord = await this.files.getPublicUrls([
      observationFile.file.id,
    ]);
    const url = urlsRecord[observationFile.file.id];

    if (!url) throw new NotFoundException();

    return {
      id: observationFile.file.id,
      name: observationFile.file.name,
      url: url.toString(),
    };
  }
}

export class GetObservationFileUrlResponseDto extends createZodDto(
  z.object({ id: z.string(), name: z.string(), url: z.url() }),
) {}
