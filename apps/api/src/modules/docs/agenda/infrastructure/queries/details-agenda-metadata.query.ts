import { Transactional } from '@nestjs-cls/transactional';
import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { AgendaVersionFinder } from '../finders/agenda-version.finder';
import { Prisma } from 'src/generated/prisma/client';
import {
  DRAFT_TRACE_SELECT,
  draftTrace,
  draftTraceSchema,
  VALIDATION_TRACE_SELECT,
  traceOf,
  traceSchema,
} from 'src/modules/docs/shared/infrastructure/document-trace';
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

  @Transactional()
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
        updatedBy: true,
        ...DRAFT_TRACE_SELECT,
        _count: { select: { nominationFiles: { where: { htmlOutdated: true } } } },
      } satisfies Prisma.AgendaVersionSelect,
    });

    if (!version) throw new NotFoundException();

    const published = publishedId
      ? await this.db.tx.agendaVersion.findUnique({
          select: VALIDATION_TRACE_SELECT satisfies Prisma.AgendaVersionSelect,
          where: { id: publishedId },
        })
      : null;

    return {
      id: version.agendaId,
      status: version.status,
      outdated: version.outdated,
      outdatedPropositions: version._count.nominationFiles,
      hasValidatedVersion: isDefined(publishedId),
      draftChangesBy: draftChangesBy(version),
      draft: draftTrace(version),
      validation: traceOf(published?.validatedAt, published?.validator),
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
    draft: draftTraceSchema,
    validation: traceSchema,
    chairmanId: z.string().nullable(),
    isManuallyEdited: z.boolean(),
    date: dateOnlyJsonSchema,
    sessionMeetingDate: dateOnlyJsonSchema,
  }),
) {}
