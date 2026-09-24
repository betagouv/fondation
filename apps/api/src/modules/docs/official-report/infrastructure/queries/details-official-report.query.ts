import { Transactional } from '@nestjs-cls/transactional';
import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { OfficialReportVersionFinder } from '../finders/official-report-version.finder';
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
import { DateOnly, dateOnlyJsonSchema } from 'src/utils/date-only';
import { isDefined } from 'src/utils/is-defined';
import { dateToTimeOnly, timeOnlySchema } from 'src/utils/time-only';

@Injectable()
export class DetailsOfficialReportQuery {
  constructor(
    private readonly db: Db,
    private readonly officialReportVersionFinder: OfficialReportVersionFinder,
  ) {}

  @Transactional()
  async handle(query: { officialReportId: string }): Promise<DetailedOfficialReportMetadataDto> {
    const versionId = await this.officialReportVersionFinder.latest({
      officialReportId: query.officialReportId,
    });
    const version = await this.db.tx.officialReportVersion.findUnique({
      where: { id: versionId },
      select: {
        status: true,
        outdated: true,
        hasRenunciation: true,
        members: { select: { memberId: true, isAbsent: true } },
        justiceDepartmentContactId: true,
        secretaryId: true,
        chairmanId: true,
        sessionMeetingDate: true,
        sessionMeetingStartingTime: true,
        sessionMeetingEndingTime: true,
        isManuallyEdited: true,
        createdBy: true,
        updatedBy: true,
        ...DRAFT_TRACE_SELECT,
        _count: { select: { nominationFiles: { where: { htmlOutdated: true } } } },
        officialReport: { select: { id: true, agendas: { select: { id: true } } } },
      } satisfies Prisma.OfficialReportVersionSelect,
    });

    if (!version) throw new NotFoundException();
    const report = { ...version, ...version.officialReport };
    const publishedId = await this.officialReportVersionFinder.published({
      officialReportId: query.officialReportId,
    });

    const published = publishedId
      ? await this.db.tx.officialReportVersion.findUnique({
          select: VALIDATION_TRACE_SELECT satisfies Prisma.OfficialReportVersionSelect,
          where: { id: publishedId },
        })
      : null;

    return {
      id: report.id,
      outdated: version.outdated,
      outdatedPropositions: version._count.nominationFiles,
      hasRenunciation: report.hasRenunciation,
      agendas: report.agendas.map(({ id }) => id).filter(isDefined),
      absentMembers: report.members.flatMap((member) =>
        member.isAbsent && member.memberId ? [member.memberId] : [],
      ),
      chairmanId: report.chairmanId,
      secretaryId: report.secretaryId,
      justiceDepartmentContactId: report.justiceDepartmentContactId?.toString() ?? null,
      isManuallyEdited: report.isManuallyEdited,
      hasValidatedVersion: isDefined(publishedId),
      draftChangesBy: draftChangesBy(version),
      draft: draftTrace(version),
      validation: traceOf(published?.validatedAt, published?.validator),
      status: report.status,
      sessionMeetingDate: DateOnly.fromUtcDate(report.sessionMeetingDate).toJson(),
      sessionMeetingStartingTime: dateToTimeOnly(report.sessionMeetingStartingTime),
      sessionMeetingEndingTime: dateToTimeOnly(report.sessionMeetingEndingTime),
    };
  }
}

export class DetailedOfficialReportMetadataDto extends createZodDto(
  z.object({
    id: z.string(),
    hasRenunciation: z.boolean(),
    absentMembers: z.array(z.string()),
    agendas: z.array(z.uuid()),
    sessionMeetingDate: dateOnlyJsonSchema,
    sessionMeetingStartingTime: timeOnlySchema,
    sessionMeetingEndingTime: timeOnlySchema,
    isManuallyEdited: z.boolean(),
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
    secretaryId: z.string().nullable(),
    justiceDepartmentContactId: z.string().nullable(),
  }),
) {}
