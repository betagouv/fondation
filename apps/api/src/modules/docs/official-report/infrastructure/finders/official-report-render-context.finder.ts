import { Transactional } from '@nestjs-cls/transactional';
import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';

import { Prisma } from '../../../../../generated/prisma/client';
import { DateOnly } from '../../../../../utils/date-only';
import { makeId } from '../../../../../utils/id';
import { assertIsDefined, isDefined } from '../../../../../utils/is-defined';
import { dateToTimeOnly } from '../../../../../utils/time-only';
import { writerOf } from '../../../../../utils/user.util';
import { Db } from '../../../../framework/database';
import { TransparenceService } from '../../../../session/transparence/infrastructure/transparence.service';
import { FormationEnum } from '../../../../shared/formation.enum';
import { prismaFormationEnumToFormationEnum } from '../../../../shared/mappers/formation.mapper';
import { prismaGenderEnumToGenderEnum } from '../../../../shared/mappers/gender-enum.mapper';
import { prismaRoleEnumToRoleEnum } from '../../../../shared/mappers/role-enum.mapper';
import { DocNominationFileOutcomeEnum } from '../../../shared/domain/doc-nomination-file-outcome';
import { agendaContentOf } from '../../../shared/infrastructure/agenda-content';
import { parseNamedMembers } from '../../../shared/infrastructure/named-members';
import { OfficialReportChairman } from '../../domain/official-report-chairman';
import { OfficialReportMember } from '../../domain/official-report-member';
import { OfficialReportMembersList } from '../../domain/official-report-member-list';
import { OfficialReportSecretary } from '../../domain/official-report-secretary';
import { OfficialReportSessionMeeting } from '../../domain/official-report-session-meeting';
import { RECORDED_SIGNATORIES, recordedSignatories } from '../recorded-signatories';
import { officialReportFileNote } from '../services/renderers/official-report-note.html';
import type { OfficialReportRenderContext } from '../services/renderers/official-report.renderer';

import { OfficialReportVersionFinder } from './official-report-version.finder';

const SIGNATORY_ACCOUNT = {
  displayTitle: true,
  duty: true,
  firstName: true,
  gender: true,
  id: true,
  lastName: true,
  role: true,
  title: true,
} as const satisfies Prisma.UserSelect;

type SignatoryAccount = Prisma.UserGetPayload<{ select: typeof SIGNATORY_ACCOUNT }>;

@Injectable()
export class OfficialReportRenderContextFinder {
  constructor(
    private readonly db: Db,
    private readonly officialReportVersionFinder: OfficialReportVersionFinder,
    @Inject(forwardRef(() => TransparenceService))
    private readonly sessions: TransparenceService,
  ) {}

  @Transactional()
  async find(query: { officialReportId: string }): Promise<OfficialReportRenderContext> {
    const versionId = await this.officialReportVersionFinder.latest(query);
    const report = await this.db.tx.officialReportVersion.findUnique({
      select: {
        ...RECORDED_SIGNATORIES,
        agendaDate: true,
        agendaPropositionCount: true,
        chairman: { select: { ...SIGNATORY_ACCOUNT, sort: true } },
        conclusionHtml: true,
        conclusionOutdated: true,
        hasRenunciation: true,
        introHtml: true,
        introOutdated: true,
        justiceDepartmentContactName: true,
        members: {
          select: {
            firstName: true,
            gender: true,
            isAbsent: true,
            lastName: true,
            memberId: true,
            sort: true,
            title: true,
          },
        },
        nominationFiles: {
          orderBy: { number: 'asc' },
          select: {
            editor: { select: { firstName: true, id: true, lastName: true } },
            grade: true,
            htmlEdited: true,
            htmlEditedAt: true,
            htmlFromAgenda: true,
            htmlOutdated: true,
            id: true,
            name: true,
            nominationFileId: true,
            note: true,
            noteEditedAt: true,
            noteEditor: { select: { firstName: true, id: true, lastName: true } },
            noteOutdatedBy: true,
            noteStatus: true,
            number: true,
            outcome: true,
            position: true,
            recusedMembers: true,
            reporters: true,
            targetedGrade: true,
            targetedPosition: true,
          },
        },
        officialReport: {
          select: {
            agenda: {
              select: {
                formation: true,
                id: true,
                sessionId: true,
                versions: {
                  orderBy: { version: 'desc' },
                  select: {
                    _count: { select: { nominationFiles: true } },
                    date: true,
                    nominationFiles: {
                      select: {
                        editor: { select: { firstName: true, id: true, lastName: true } },
                        htmlEdited: true,
                        htmlEditedAt: true,
                        nominationFileId: true,
                      },
                      where: { htmlEdited: { not: null } },
                    },
                    status: true,
                  },
                  take: 2,
                },
              },
            },
          },
        },
        secretary: { select: SIGNATORY_ACCOUNT },
        sectionIntros: { select: { html: true, outcome: true } },
        sectionTitles: { select: { outcome: true, title: true } },
        sessionDate: true,
        sessionMeetingDate: true,
        sessionMeetingEndingTime: true,
        sessionMeetingStartingTime: true,
        status: true,
      } satisfies Prisma.OfficialReportVersionSelect,
      where: { id: versionId },
    });

    if (!report) throw new NotFoundException();

    const agendaFiles = await this.db.tx.agendaNominationFile.findMany({
      distinct: ['nominationFileId'],
      select: {
        nominationFileId: true,
        version: { select: { agendaId: true } },
      } satisfies Prisma.AgendaNominationFileSelect,
      where: {
        nominationFileId: { not: null },
        version: { agenda: { officialReportId: query.officialReportId } },
      },
    });
    const fileAgendas = new Map(
      agendaFiles.flatMap(({ nominationFileId, version }) =>
        nominationFileId ? [[nominationFileId, version.agendaId] as const] : [],
      ),
    );

    const { agenda } = report.officialReport;
    // the report speaks of the agenda as it was validated, and of its draft only while the agenda
    // has never been validated, which is the one case where nothing else exists to speak of
    const agendaContent = agendaContentOf(agenda?.versions ?? []);
    if (!agenda || !agendaContent) throw new NotFoundException();

    const agendaProposals = new Map(
      agendaContent.nominationFiles.flatMap((file) =>
        file.nominationFileId && file.htmlEdited
          ? [
              [
                file.nominationFileId,
                { at: file.htmlEditedAt, by: writerOf(file.editor), html: file.htmlEdited },
              ] as const,
            ]
          : [],
      ),
    );

    const formation = prismaFormationEnumToFormationEnum(agenda.formation);

    // a validated report never changes: it reads as the validation recorded it
    const isValidated = report.status === 'VALIDATED';
    // a validation needs a stored PDF, whose render recorded these; a PDF the former code rendered during
    // the deploy recorded nothing, and its report reads today's values as it did before
    const printed =
      isValidated && report.agendaDate && report.sessionDate && isDefined(report.agendaPropositionCount)
        ? {
            agendaDate: DateOnly.fromUtcDate(report.agendaDate),
            propositionCount: report.agendaPropositionCount,
            sessionDate: DateOnly.fromUtcDate(report.sessionDate),
          }
        : {
            agendaDate: DateOnly.fromUtcDate(agendaContent.date),
            propositionCount: agendaContent._count.nominationFiles,
            sessionDate: (await this.sessions.internalGetSession({ sessionId: agenda.sessionId })).date,
          };
    const { chairman, secretary } = isValidated
      ? recordedSignatories(report)
      : this.currentSignatories(report, { formation, officialReportId: query.officialReportId });

    // a draft prints its members under their name of today, as it does its chairman and its secretary
    const accounts = isValidated
      ? []
      : await this.db.tx.user.findMany({
          select: { firstName: true, id: true, lastName: true } satisfies Prisma.UserSelect,
          where: { id: { in: report.members.map(({ memberId }) => memberId) } },
        });
    const names = new Map(accounts.map(({ id, ...name }) => [id, name]));
    const membersList = OfficialReportMembersList.from(
      report.members.map((member) =>
        OfficialReportMember.recorded({
          ...member,
          ...names.get(member.memberId),
          gender: prismaGenderEnumToGenderEnum(member.gender),
        }),
      ),
    );

    const userDefinedInto = report.introHtml?.trim()
      ? { html: report.introHtml?.trim(), isOutdated: report.introOutdated }
      : undefined;

    const userDefinedConclusion = report.conclusionHtml?.trim()
      ? { html: report.conclusionHtml?.trim(), isOutdated: report.conclusionOutdated }
      : undefined;

    const sectionTitles = report.sectionTitles.flatMap(({ outcome, title }) => {
      const html = title?.trim();
      if (!html) return [];

      return [{ html, outcome, type: 'title' as const }];
    });
    const sectionIntros = report.sectionIntros.map(({ html, outcome }) => ({
      html,
      outcome,
      type: 'intro' as const,
    }));

    const userDefinedOutcomes = [...sectionTitles, ...sectionIntros].reduce(
      (outcomes, x) => ({
        ...outcomes,
        [x.outcome]: {
          ...outcomes[x.outcome],
          [x.type]: { html: x.html, isOutdated: false },
        },
      }),
      {} as {
        [K in DocNominationFileOutcomeEnum]?: {
          [KK in 'title' | 'intro']?: { html: string; isOutdated: boolean };
        };
      },
    );

    // a block the report never rewrote still goes stale when the agenda writes its own sentence,
    // so the flag travels even with no text of its own
    const userDefinedFiles = Object.fromEntries(
      report.nominationFiles
        .filter((f) => f.nominationFileId && (f.htmlEdited?.trim() || f.htmlOutdated))
        .map(
          (f) =>
            [
              f.nominationFileId,
              {
                editedAt: f.htmlEditedAt,
                editedBy: writerOf(f.editor),
                fromAgenda: f.htmlFromAgenda,
                html: f.htmlEdited,
                isOutdated: f.htmlOutdated,
              },
            ] as const,
        ),
    );

    const sessionMeeting = OfficialReportSessionMeeting.from({
      date: DateOnly.fromUtcDate(report.sessionMeetingDate),
      endTime: dateToTimeOnly(report.sessionMeetingEndingTime),
      startTime: dateToTimeOnly(report.sessionMeetingStartingTime),
    });

    return {
      agenda: {
        date: printed.agendaDate,
        formation,
        id: agenda.id,
        propositionCount: printed.propositionCount,
      },
      agendaProposals,
      chairman,
      fileAgendas,
      files: report.nominationFiles.map((f) => ({
        currentGrade: f.grade,
        currentPosition: f.position,
        id: f.id,
        name: f.name,
        nominationFileId: isDefined(f.nominationFileId)
          ? makeId('NominationFileId', f.nominationFileId)
          : null,
        note: officialReportFileNote(f),
        number: f.number,
        outcome: f.outcome,
        reporters: parseNamedMembers(f.reporters).map(({ name }) => name),
        targetedGrade: f.targetedGrade,
        targetedPosition: f.targetedPosition ?? '',
      })),
      hasRenouncement: report.hasRenunciation,
      justiceDepartmentContact: report.justiceDepartmentContactName,
      members: membersList,
      secretary,
      session: { date: printed.sessionDate, id: agenda.sessionId },
      sessionMeeting,
      userDefinedBlocks: {
        conclusion: userDefinedConclusion,
        files: userDefinedFiles,
        intro: userDefinedInto,
        outcomes: userDefinedOutcomes,
      },
    } satisfies OfficialReportRenderContext;
  }

  /** a draft names its chairman and its secretary after their account, which must still fit the part */
  private currentSignatories(
    report: { chairman: (SignatoryAccount & { sort: number }) | null; secretary: SignatoryAccount | null },
    context: { formation: FormationEnum; officialReportId: string },
  ): { chairman: OfficialReportChairman; secretary: OfficialReportSecretary } {
    const chairman = assertIsDefined(
      report.chairman,
      `unknown chairman for official report "${context.officialReportId}"`,
    );
    const secretary = assertIsDefined(
      report.secretary,
      `unknown secretary for official report "${context.officialReportId}"`,
    );

    return {
      chairman: OfficialReportChairman.from({
        ...chairman,
        expectedFormation: context.formation,
        gender: prismaGenderEnumToGenderEnum(chairman.gender),
        role: prismaRoleEnumToRoleEnum(chairman.role),
      }),
      secretary: OfficialReportSecretary.from({
        ...secretary,
        gender: prismaGenderEnumToGenderEnum(secretary.gender),
        role: prismaRoleEnumToRoleEnum(secretary.role),
      }),
    };
  }
}
