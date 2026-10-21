import { Transactional } from '@nestjs-cls/transactional';
import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';

import { OfficialReportChairman } from '../../domain/official-report-chairman';
import { OfficialReportMember } from '../../domain/official-report-member';
import { OfficialReportMembersList } from '../../domain/official-report-member-list';
import { OfficialReportSecretary } from '../../domain/official-report-secretary';
import { OfficialReportSessionMeeting } from '../../domain/official-report-session-meeting';
import type { OfficialReportRenderContext } from '../services/renderers/official-report.renderer';
import { Prisma } from 'src/generated/prisma/client';
import { DocNominationFileOutcomeEnum } from 'src/modules/docs/shared/domain/doc-nomination-file-outcome';
import { agendaContentOf } from 'src/modules/docs/shared/infrastructure/agenda-content';
import { Db } from 'src/modules/framework/database';
import { TransparenceService } from 'src/modules/session/transparence/infrastructure/transparence.service';
import { prismaFormationEnumToFormationEnum } from 'src/modules/shared/mappers/formation.mapper';
import { prismaGenderEnumToGenderEnum } from 'src/modules/shared/mappers/gender-enum.mapper';
import { prismaRoleEnumToRoleEnum } from 'src/modules/shared/mappers/role-enum.mapper';
import { DateOnly } from 'src/utils/date-only';
import { makeId } from 'src/utils/id';
import { assertIsDefined, isDefined } from 'src/utils/is-defined';
import { dateToTimeOnly } from 'src/utils/time-only';
import { fullname } from 'src/utils/user.util';

import { OfficialReportVersionFinder } from './official-report-version.finder';

function writer(
  user: { id: string; firstName: string; lastName: string } | null,
): { id: string; name: string } | null {
  return user ? { id: user.id, name: fullname(user) } : null;
}

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
        chairman: {
          select: {
            displayTitle: true,
            duty: true,
            firstName: true,
            gender: true,
            id: true,
            lastName: true,
            role: true,
            sort: true,
            title: true,
          },
        },
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
            number: true,
            outcome: true,
            position: true,
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
        secretary: {
          select: {
            displayTitle: true,
            duty: true,
            firstName: true,
            gender: true,
            id: true,
            lastName: true,
            role: true,
            title: true,
          },
        },
        sectionIntros: { select: { html: true, outcome: true } },
        sectionTitles: { select: { outcome: true, title: true } },
        sessionMeetingDate: true,
        sessionMeetingEndingTime: true,
        sessionMeetingStartingTime: true,
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
                { at: file.htmlEditedAt, by: writer(file.editor), html: file.htmlEdited },
              ] as const,
            ]
          : [],
      ),
    );

    const session = await this.sessions.internalGetSession({ sessionId: agenda.sessionId });

    const formation = prismaFormationEnumToFormationEnum(agenda.formation);

    const rawChairman = assertIsDefined(
      report.chairman,
      `unknown chairman for official report "${query.officialReportId}"`,
    );
    const chairman = OfficialReportChairman.from({
      ...rawChairman,
      expectedFormation: formation,
      gender: prismaGenderEnumToGenderEnum(rawChairman.gender),
      role: prismaRoleEnumToRoleEnum(rawChairman.role),
    });

    const rawSecretary = assertIsDefined(
      report.secretary,
      `unknown secretary for official report "${query.officialReportId}"`,
    );
    const secretary = OfficialReportSecretary.from({
      ...rawSecretary,
      gender: prismaGenderEnumToGenderEnum(rawSecretary.gender),
      role: prismaRoleEnumToRoleEnum(rawSecretary.role),
    });

    const membersList = OfficialReportMembersList.from(
      report.members.map((member) =>
        OfficialReportMember.recorded({ ...member, gender: prismaGenderEnumToGenderEnum(member.gender) }),
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
                editedBy: writer(f.editor),
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
        date: DateOnly.fromUtcDate(agendaContent.date),
        formation,
        id: agenda.id,
        propositionCount: agendaContent._count.nominationFiles,
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
        number: f.number,
        outcome: f.outcome,
        reporters: f.reporters,
        targetedGrade: f.targetedGrade,
        targetedPosition: f.targetedPosition ?? '',
      })),
      hasRenouncement: report.hasRenunciation,
      justiceDepartmentContact: report.justiceDepartmentContactName,
      members: membersList,
      secretary,
      session: { date: session.date, id: agenda.sessionId },
      sessionMeeting,
      userDefinedBlocks: {
        conclusion: userDefinedConclusion,
        files: userDefinedFiles,
        intro: userDefinedInto,
        outcomes: userDefinedOutcomes,
      },
    } satisfies OfficialReportRenderContext;
  }
}
