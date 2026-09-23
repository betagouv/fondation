import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { AgendaVersionFinder } from '../finders/agenda-version.finder';
import { Prisma } from 'src/generated/prisma/client';
import {
  draftChangesBy,
  draftChangesBySchema,
} from 'src/modules/docs/shared/infrastructure/draft-changes-by';
import { Db } from 'src/modules/framework/database';
import { dateOnlyJsonSchema } from 'src/utils/date-only';
import { DateOnly } from 'src/utils/date-only';
import { isDefined } from 'src/utils/is-defined';

@Injectable()
export class DetailsAgendaMetadataQuery {
  constructor(
    private readonly db: Db,
    private readonly agendaVersionFinder: AgendaVersionFinder,
  ) {}

  async handle(query: { agendaId: string }): Promise<DetailedAgendaMetadata> {
    const versionId = await this.agendaVersionFinder.latest({ agendaId: query.agendaId });
    const publishedId = await this.agendaVersionFinder.published({ agendaId: query.agendaId });

    const version = await this.db.tx.agendaVersion.findUnique({
      where: { id: versionId },
      select: {
        agendaId: true,
        status: true,
        outdated: true,
        chairmanId: true,
        date: true,
        sessionMeetingDate: true,
        isManuallyEdited: true,
        createdBy: true,
        systemUpdatedAt: true,
        updatedBy: true,
        _count: { select: { nominationFiles: { where: { htmlOutdated: true } } } },
      } satisfies Prisma.AgendaVersionSelect,
    });

    if (!version) throw new NotFoundException();

    return {
      id: version.agendaId,
      status: version.status,
      outdated: version.outdated,
      outdatedPropositions: version._count.nominationFiles,
      hasValidatedVersion: isDefined(publishedId),
      draftChangesBy: draftChangesBy(version),
      chairmanId: version.chairmanId,
      isManuallyEdited: version.isManuallyEdited,
      date: DateOnly.fromUtcDate(version.date).toJson(),
      sessionMeetingDate: DateOnly.fromUtcDate(version.sessionMeetingDate).toJson(),
    };
  }
}

export class DetailedAgendaMetadata extends createZodDto(
  z.object({
    id: z.string(),
    status: z.enum(['DRAFT', 'VALIDATED']),
    /** another text is proposed for at least one of its blocks, and waits for the reader's call */
    outdated: z.boolean(),
    /** zero while the introduction or the conclusion is the one waiting */
    outdatedPropositions: z.number().int(),
    /** a validated version remains underneath, so the draft can be discarded */
    hasValidatedVersion: z.boolean(),
    draftChangesBy: draftChangesBySchema,
    chairmanId: z.string().nullable(),
    isManuallyEdited: z.boolean(),
    date: dateOnlyJsonSchema,
    sessionMeetingDate: dateOnlyJsonSchema,
  }),
) {}
