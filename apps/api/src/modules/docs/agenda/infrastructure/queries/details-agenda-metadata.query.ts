import { Transactional } from '@nestjs-cls/transactional';
import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Prisma } from '../../../../../generated/prisma/client';
import { dateOnlyJsonSchema } from '../../../../../utils/date-only';
import { DateOnly } from '../../../../../utils/date-only';
import { isDefined } from '../../../../../utils/is-defined';
import { Db } from '../../../../framework/database';
import { canDiscardDraft, canValidateDocument } from '../../../shared/domain/document.policies';
import {
  DRAFT_TRACE_SELECT,
  draftTrace,
  draftTraceSchema,
  VALIDATION_TRACE_SELECT,
  traceOf,
  traceSchema,
} from '../../../shared/infrastructure/document-trace';
import { draftChangesBy, draftChangesBySchema } from '../../../shared/infrastructure/draft-changes-by';
import { AgendaVersionFinder } from '../finders/agenda-version.finder';

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
      select: {
        ...DRAFT_TRACE_SELECT,
        _count: { select: { nominationFiles: { where: { htmlOutdated: true } } } },
        agendaId: true,
        chairmanId: true,
        createdBy: true,
        date: true,
        isManuallyEdited: true,
        outdated: true,
        sessionMeetingDate: true,
        status: true,
        updatedBy: true,
      } satisfies Prisma.AgendaVersionSelect,
      where: { id: versionId },
    });

    if (!version) throw new NotFoundException();

    const published = publishedId
      ? await this.db.tx.agendaVersion.findUnique({
          select: VALIDATION_TRACE_SELECT satisfies Prisma.AgendaVersionSelect,
          where: { id: publishedId },
        })
      : null;

    const changesBy = draftChangesBy(version);
    const hasValidatedVersion = isDefined(publishedId);

    return {
      id: version.agendaId,
      status: version.status,
      outdated: version.outdated,
      outdatedPropositions: version._count.nominationFiles,
      hasValidatedVersion,
      canDiscardDraft: canDiscardDraft({ changesBy, hasValidatedVersion }),
      canValidate: canValidateDocument({ isValidated: version.status === 'VALIDATED' }),
      draftChangesBy: changesBy,
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
    hasValidatedVersion: z.boolean(),
    canDiscardDraft: z.boolean(),
    canValidate: z.boolean(),
    draftChangesBy: draftChangesBySchema,
    draft: draftTraceSchema,
    validation: traceSchema,
    chairmanId: z.string().nullable(),
    isManuallyEdited: z.boolean(),
    date: dateOnlyJsonSchema,
    sessionMeetingDate: dateOnlyJsonSchema,
  }),
) {}
