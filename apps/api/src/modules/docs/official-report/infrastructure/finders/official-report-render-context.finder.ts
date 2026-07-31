import { Transactional } from '@nestjs-cls/transactional';
import { Injectable, NotFoundException } from '@nestjs/common';

import { OfficialReportChairman } from '../../domain/official-report-chairman';
import { OfficialReportMember } from '../../domain/official-report-member';
import { OfficialReportMembersList } from '../../domain/official-report-member-list';
import { OfficialReportSecretary } from '../../domain/official-report-secretary';
import { OfficialReportSessionMeeting } from '../../domain/official-report-session-meeting';
import type { OfficialReportRenderContext } from '../services/renderers/official-report.renderer';
import { DocNominationFileOutcomeEnum } from 'src/modules/docs/shared/domain/doc-nomination-file-outcome';
import { Db } from 'src/modules/framework/database';
import { MembersService } from 'src/modules/members';
import { prismaFormationEnumToFormationEnum } from 'src/modules/shared/mappers/formation.mapper';
import { prismaGenderEnumToGenderEnum } from 'src/modules/shared/mappers/gender-enum.mapper';
import { prismaRoleEnumToRoleEnum } from 'src/modules/shared/mappers/role-enum.mapper';
import { DateOnly } from 'src/utils/date-only';
import { Id, makeId } from 'src/utils/id';
import { assertIsDefined, isDefined } from 'src/utils/is-defined';
import { dateToTimeOnly } from 'src/utils/time-only';

@Injectable()
export class OfficialReportRenderContextFinder {
  constructor(
    private readonly db: Db,
    private readonly members: MembersService,
  ) {}

  @Transactional()
  async find(query: { officialReportId: string }): Promise<OfficialReportRenderContext> {
    const report = await this.db.tx.officialReport.findUnique({
      where: { id: query.officialReportId },
      select: {
        hasRenunciation: true,
        justiceDepartmentContactName: true,

        sessionMeetingDate: true,
        sessionMeetingStartingTime: true,
        sessionMeetingEndingTime: true,

        agendas: { select: { id: true, sessionId: true, formation: true, date: true } },

        chairman: {
          select: {
            id: true,
            lastName: true,
            firstName: true,
            title: true,
            displayTitle: true,
            duty: true,
            role: true,
            gender: true,
            sort: true,
          },
        },

        secretary: {
          select: {
            id: true,
            lastName: true,
            firstName: true,
            title: true,
            displayTitle: true,
            duty: true,
            role: true,
            gender: true,
          },
        },

        members: { select: { memberId: true, isAbsent: true } },

        nominationFiles: {
          select: {
            id: true,
            number: true,
            nominationFileId: true,

            name: true,
            position: true,
            grade: true,
            targetedPosition: true,
            targetedGrade: true,
            reporters: true,
            outcome: true,

            htmlEdited: true,
            htmlOutdated: true,
          },
        },

        introHtml: true,
        introOutdated: true,
        conclusionHtml: true,
        conclusionOutdated: true,
        sectionTitles: { select: { outcome: true, title: true } },
        sectionIntros: { select: { outcome: true, html: true } },
      },
    });

    if (!report) throw new NotFoundException();

    const agenda = report.agendas[0];
    if (!agenda) throw new NotFoundException();

    const session = await this.db.tx.session.findUnique({
      where: { id: agenda.sessionId, deletedAt: null },
      select: { date: true, formation: true },
    });
    if (!session) throw new NotFoundException();

    const formation = prismaFormationEnumToFormationEnum(agenda.formation);

    const rawChairman = assertIsDefined(
      report.chairman,
      `unknown chairman for official report "${query.officialReportId}"`,
    );
    const chairman = OfficialReportChairman.from({
      ...rawChairman,
      role: prismaRoleEnumToRoleEnum(rawChairman.role),
      gender: prismaGenderEnumToGenderEnum(rawChairman.gender),
      expectedFormation: formation,
    });

    const rawSecretary = assertIsDefined(
      report.secretary,
      `unknown secretary for official report "${query.officialReportId}"`,
    );
    const secretary = OfficialReportSecretary.from({
      ...rawSecretary,
      role: prismaRoleEnumToRoleEnum(rawSecretary.role),
      gender: prismaGenderEnumToGenderEnum(rawSecretary.gender),
    });

    const absentMembers = new Map(
      report.members.map(({ memberId, isAbsent }) => [memberId, isAbsent] as const),
    );
    const members = await this.members.internalFindMembersByFormation({ formation });

    const membersList = OfficialReportMembersList.from(
      members.flatMap((member) => {
        const isAbsent = absentMembers.get(member.id);
        if (!isDefined(isAbsent)) return [];

        // oxlint-disable-next-line typescript/no-misused-spread
        return [OfficialReportMember.from({ ...member, isAbsent, expectedFormation: formation })];
      }),
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

      return [{ type: 'title' as const, outcome, html }];
    });
    const sectionIntros = report.sectionIntros.map(({ outcome, html }) => ({
      type: 'intro' as const,
      outcome,
      html,
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

    const userDefinedFiles = Object.fromEntries(
      report.nominationFiles
        .filter((f) => f.nominationFileId && f.htmlEdited?.trim())
        .map((f) => [f.nominationFileId, { html: f.htmlEdited, isOutdated: f.htmlOutdated }] as const),
    ) as Record<Id<'NominationFileId'>, { html: string; isOutdated: boolean }>;

    const sessionMeeting = OfficialReportSessionMeeting.from({
      date: DateOnly.fromDate(report.sessionMeetingDate),
      startTime: dateToTimeOnly(report.sessionMeetingStartingTime),
      endTime: dateToTimeOnly(report.sessionMeetingEndingTime),
    });

    return {
      chairman,
      secretary,
      sessionMeeting,
      members: membersList,
      hasRenouncement: report.hasRenunciation,
      justiceDepartmentContact: report.justiceDepartmentContactName,
      session: { id: agenda.sessionId, date: DateOnly.fromDate(session.date) },
      agenda: { id: agenda.id, formation, date: DateOnly.fromDate(agenda.date) },
      userDefinedBlocks: {
        intro: userDefinedInto,
        conclusion: userDefinedConclusion,
        files: userDefinedFiles,
        outcomes: userDefinedOutcomes,
      },
      files: report.nominationFiles.map((f) => ({
        id: f.id,
        number: f.number,
        nominationFileId: isDefined(f.nominationFileId)
          ? makeId('NominationFileId', f.nominationFileId)
          : null,
        name: f.name,
        currentPosition: f.position,
        currentGrade: f.grade,
        targetedPosition: f.targetedPosition ?? '',
        targetedGrade: f.targetedGrade,
        reporters: f.reporters,
        outcome: f.outcome,
      })),
    } satisfies OfficialReportRenderContext;
  }
}
