import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Prisma } from 'src/generated/prisma/client';
import { Db } from 'src/modules/framework/database';
import { fullname } from 'src/utils/user.util';

type AuditionVersion = {
  author: { firstName: string; id: string; lastName: string } | null;
  date: Date | null;
  requested: boolean | null;
  time: Date | null;
  writtenAt: Date;
};

const scheduleKey = (version: AuditionVersion) =>
  `${version.date?.toISOString()}|${version.time?.toISOString()}`;

// each version records the whole audition: the request and the date shown are the ones of the last change that set them
export function currentAuditionChanges(versions: readonly AuditionVersion[]): {
  requested: AuditionVersion | null;
  scheduled: AuditionVersion | null;
} {
  let requested: AuditionVersion | null = null;
  let scheduled: AuditionVersion | null = null;
  let previous: AuditionVersion | undefined;

  for (const version of versions) {
    if (version.requested !== true) requested = null;
    else if (previous?.requested !== true) requested = version;

    if (!version.date) scheduled = null;
    else if (!previous || scheduleKey(previous) !== scheduleKey(version)) scheduled = version;

    previous = version;
  }

  return { requested, scheduled };
}

@Injectable()
export class DetailNominationFileAuditionHistoryQuery {
  constructor(private readonly db: Db) {}

  @Transactional()
  async handle(query: {
    nominationFileId: string;
    sessionId: string;
  }): Promise<DetailedNominationFileAuditionHistoryDto> {
    const versions = await this.db.tx.nominationFileAuditionVersion.findMany({
      orderBy: { writtenAt: 'asc' },
      select: {
        author: { select: { firstName: true, id: true, lastName: true } },
        date: true,
        requested: true,
        time: true,
        writtenAt: true,
      } satisfies Prisma.NominationFileAuditionVersionSelect,
      where: { nominationFile: { sessionId: query.sessionId }, nominationFileId: query.nominationFileId },
    });
    const { requested, scheduled } = currentAuditionChanges(versions);

    return { requested: changeOf(requested), scheduled: changeOf(scheduled) };
  }
}

function changeOf(version: AuditionVersion | null) {
  if (!version) return null;

  return {
    at: version.writtenAt.toISOString(),
    by: version.author ? { id: version.author.id, name: fullname(version.author) } : null,
  };
}

const changeSchema = z
  .object({ at: z.iso.datetime(), by: z.object({ id: z.string(), name: z.string() }).nullable() })
  .nullable();

export class DetailedNominationFileAuditionHistoryDto extends createZodDto(
  z.object({ requested: changeSchema, scheduled: changeSchema }),
) {}
