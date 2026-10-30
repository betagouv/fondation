import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Prisma } from '../../../../generated/prisma/client';
import { Db } from '../../../framework/database';
import { Files } from '../../../framework/files';
import { TransparenceService } from '../../../session/transparence/infrastructure/transparence.service';
import type { RoleEnum } from '../../../shared/role.enum';

@Injectable()
export class GetObservationFileUrlQuery {
  constructor(
    private readonly db: Db,
    private readonly files: Files,

    @Inject(forwardRef(() => TransparenceService))
    private readonly transparences: TransparenceService,
  ) {}

  async handle(query: {
    fileId: string;
    nominationFileId: string;
    observationId: string;
    role: RoleEnum;
    sessionId: string;
  }): Promise<GetObservationFileUrlResponseDto> {
    await this.transparences.internalGetVisibleSession(query);

    const observationFile = await this.db.tx.observationFile.findUnique({
      where: {
        observation: { nominationFileId: query.nominationFileId, sessionId: query.sessionId },
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
      } satisfies Prisma.ObservationFileSelect,
    });

    if (!observationFile) throw new NotFoundException();

    const urlsRecord = await this.files.getPublicUrls([observationFile.file.id]);
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
