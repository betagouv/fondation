import { Transactional } from '@nestjs-cls/transactional';
import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Prisma } from '../../../../../generated/prisma/client';
import { DateOnly, dateOnlyJsonSchema } from '../../../../../utils/date-only';
import { isDefined } from '../../../../../utils/is-defined';
import { dateToTimeOnly, timeOnlySchema } from '../../../../../utils/time-only';
import { Db } from '../../../../framework/database';
import { DOC_SYSTEM_UPDATE_CAUSES } from '../../../shared/domain/doc-system-update-cause';
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
import { OfficialReportVersionFinder } from '../finders/official-report-version.finder';

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
        chairmanId: true,
        createdBy: true,
        hasRenunciation: true,
        isManuallyEdited: true,
        justiceDepartmentContactId: true,
        members: { select: { isAbsent: true, memberId: true } },
        outdated: true,
        secretaryId: true,
        sessionMeetingDate: true,
        sessionMeetingEndingTime: true,
        sessionMeetingStartingTime: true,
        status: true,
        updatedBy: true,
        ...DRAFT_TRACE_SELECT,
        _count: { select: { nominationFiles: { where: { htmlOutdated: true } } } },
        officialReport: { select: { agenda: { select: { id: true } }, id: true } },
      } satisfies Prisma.OfficialReportVersionSelect,
    });

    if (!version) throw new NotFoundException();
    const report = { ...version, ...version.officialReport };
    const publishedId = await this.officialReportVersionFinder.published({
      officialReportId: query.officialReportId,
    });

    const published = publishedId
      ? await this.db.tx.officialReportVersion.findUnique({
          where: { id: publishedId },
          select: {
            ...VALIDATION_TRACE_SELECT,
            skippedUpdates: { select: { cause: true }, orderBy: { at: 'asc' } },
          } satisfies Prisma.OfficialReportVersionSelect,
        })
      : null;

    const changesBy = draftChangesBy(version);
    const hasValidatedVersion = isDefined(publishedId);

    return {
      id: report.id,
      outdated: version.outdated,
      outdatedPropositions: version._count.nominationFiles,
      hasRenunciation: report.hasRenunciation,
      agendaId: report.agenda?.id ?? null,
      absentMembers: report.members.flatMap((member) =>
        member.isAbsent && member.memberId ? [member.memberId] : [],
      ),
      recordedMembers: report.members.flatMap(({ memberId }) => (memberId ? [memberId] : [])),
      chairmanId: report.chairmanId,
      secretaryId: report.secretaryId,
      justiceDepartmentContactId: report.justiceDepartmentContactId?.toString() ?? null,
      isManuallyEdited: report.isManuallyEdited,
      hasValidatedVersion,
      canValidate: canValidateDocument({ isValidated: version.status === 'VALIDATED' }),
      canDiscardDraft: canDiscardDraft({ changesBy, hasValidatedVersion }),
      draftChangesBy: changesBy,
      draft: draftTrace(version),
      changedSinceValidation: published?.skippedUpdates.map(({ cause }) => cause) ?? [],
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
    recordedMembers: z.array(z.string()),
    agendaId: z.uuid().nullable(),
    sessionMeetingDate: dateOnlyJsonSchema,
    sessionMeetingStartingTime: timeOnlySchema,
    sessionMeetingEndingTime: timeOnlySchema,
    isManuallyEdited: z.boolean(),
    status: z.enum(['DRAFT', 'VALIDATED']),
    /** another text is proposed for at least one of its blocks, and waits for the reader's call */
    outdated: z.boolean(),
    /** zero while the introduction or the conclusion is the one waiting */
    outdatedPropositions: z.number().int(),
    /** a validated version remains underneath the draft */
    hasValidatedVersion: z.boolean(),
    canValidate: z.boolean(),
    canDiscardDraft: z.boolean(),
    draftChangesBy: draftChangesBySchema,
    draft: draftTraceSchema,
    /** what changed elsewhere since the validated version, which kept the meeting as it was held */
    changedSinceValidation: z.array(z.enum(DOC_SYSTEM_UPDATE_CAUSES)),
    validation: traceSchema,
    chairmanId: z.string().nullable(),
    secretaryId: z.string().nullable(),
    justiceDepartmentContactId: z.string().nullable(),
  }),
) {}
