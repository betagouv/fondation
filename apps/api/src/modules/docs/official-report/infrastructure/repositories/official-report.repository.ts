import { Propagation, Transactional } from '@nestjs-cls/transactional';
import {
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { DocNominationFileOutcomeEnum } from '../../../shared/domain/doc-nomination-file-outcome';
import { DocsNominationFilesFinder } from '../../../shared/infrastructure/finders/docs-nomination-files.finder';
import {
  OfficialReport,
  OfficialReportConclusionEdited,
  OfficialReportConclusionReset,
  OfficialReportCreated,
  OfficialReportDeleted,
  OfficialReportDocumentReset,
  OfficialReportFileEdited,
  OfficialReportFileReset,
  OfficialReportIntroEdited,
  OfficialReportIntroReset,
  OfficialReportInvalidated,
  OfficialReportSectionIntroEdited,
  OfficialReportSectionIntroReset,
  OfficialReportSectionTitleEdited,
  OfficialReportSectionTitleReset,
  OfficialReportUpdated,
} from '../../domain/official-report';
import { OfficialReportAgenda } from '../../domain/official-report-agenda';
import { OfficialReportChairman } from '../../domain/official-report-chairman';
import { OfficialReportMember } from '../../domain/official-report-member';
import { OfficialReportMembersList } from '../../domain/official-report-member-list';
import { OfficialReportSecretary } from '../../domain/official-report-secretary';
import { OfficialReportSessionMeeting } from '../../domain/official-report-session-meeting';
import { OfficialReportSnapshot } from '../../domain/snapshot/official-report-snapshot';
import { OfficialReportSnapshotFile } from '../../domain/snapshot/official-report-snapshot-file';
import { OfficialReportSnapshotMeta } from '../../domain/snapshot/official-report-snapshot-meta';
import { Prisma, PrismaDocsFileOutcomeEnum } from 'src/generated/prisma/client';
import { Db } from 'src/modules/framework/database';
import { Files } from 'src/modules/framework/files';
import { TransparenceService } from 'src/modules/session/transparence/infrastructure/transparence.service';
import { prismaFormationEnumToFormationEnum } from 'src/modules/shared/mappers/formation.mapper';
import { prismaGenderEnumToGenderEnum } from 'src/modules/shared/mappers/gender-enum.mapper';
import { assertNever } from 'src/utils/assert-never';
import { DateOnly } from 'src/utils/date-only';
import { Id, makeId } from 'src/utils/id';
import { assertIsDefined, isDefined } from 'src/utils/is-defined';
import { dateToTimeOnly, timeOnlyToDate } from 'src/utils/time-only';

@Injectable()
export class OfficialReportRepository {
  private readonly logger = new Logger(OfficialReportRepository.name);
  constructor(
    private readonly db: Db,
    private readonly nominationFilesFinder: DocsNominationFilesFinder,
    private readonly files: Files,

    @Inject(forwardRef(() => TransparenceService))
    private readonly sessions: TransparenceService,
  ) {}

  @Transactional()
  async find(query: { id: string }): Promise<OfficialReport> {
    const officialReport = await this.db.tx.officialReport.findUnique({
      where: { id: query.id },
      select: {
        id: true,
        hasRenunciation: true,
        justiceDepartmentContactId: true,
        sessionMeetingDate: true,
        sessionMeetingStartingTime: true,
        sessionMeetingEndingTime: true,

        introHtml: true,
        conclusionHtml: true,

        agendas: {
          select: { id: true, formation: true, officialReportId: true, sessionId: true, date: true },
          take: 1,
        },

        chairmanId: true,
        chairmanFirstName: true,
        chairmanLastName: true,
        chairmanGender: true,
        chairmanTitle: true,
        chairmanDisplayTitle: true,

        secretaryId: true,
        secretaryFirstName: true,
        secretaryLastName: true,
        secretaryGender: true,
        secretaryTitle: true,
        secretaryDisplayTitle: true,

        members: {
          select: {
            memberId: true,
            id: true,
            firstName: true,
            lastName: true,
            gender: true,
            title: true,
            isAbsent: true,
            sort: true,
          },
        },
      },
    });

    if (!officialReport) throw new NotFoundException();

    const officialReportId = makeId('OfficialReportId', officialReport.id);
    const rawAgenda = assertIsDefined(
      officialReport.agendas[0],
      `Official Report "${query.id}" has no agenda`,
    );

    const { date } = await this.sessions.details({
      formation: undefined,
      sessionId: rawAgenda.sessionId,
    });

    const agenda = OfficialReportAgenda.from({
      ignoreOfficialReportId: officialReportId,
      agenda: {
        id: rawAgenda.id,
        officialReportId: rawAgenda.officialReportId,
        date: DateOnly.fromUtcDate(rawAgenda.date),
        formation: prismaFormationEnumToFormationEnum(rawAgenda.formation),
        session: { id: rawAgenda.sessionId, date: DateOnly.fromJson(date) },
      },
    });

    const members = OfficialReportMembersList.from(
      officialReport.members.map(
        (member) =>
          new OfficialReportMember(
            member.memberId,
            member.firstName,
            member.lastName,
            prismaGenderEnumToGenderEnum(member.gender),
            member.sort,
            member.title,
            member.isAbsent,
          ),
      ),
    );

    const chairman = new OfficialReportChairman(
      officialReport.chairmanId,
      officialReport.chairmanFirstName,
      officialReport.chairmanLastName,
      prismaGenderEnumToGenderEnum(officialReport.chairmanGender),
      officialReport.chairmanDisplayTitle,
      officialReport.chairmanTitle as any,
    );

    const secretary = new OfficialReportSecretary(
      officialReport.secretaryId,
      officialReport.secretaryFirstName,
      officialReport.secretaryLastName,
      prismaGenderEnumToGenderEnum(officialReport.secretaryGender),
      officialReport.secretaryDisplayTitle,
      officialReport.secretaryTitle as any,
    );

    const files = await this.findOfficialReportFiles({ id: query.id });

    const sessionMeeting = OfficialReportSessionMeeting.from({
      date: DateOnly.fromUtcDate(officialReport.sessionMeetingDate),
      startTime: dateToTimeOnly(officialReport.sessionMeetingStartingTime),
      endTime: dateToTimeOnly(officialReport.sessionMeetingEndingTime),
    });

    const snapshot = OfficialReportSnapshot.from({
      files,
      agenda,
      members,
      chairman,
      secretary,
      sessionMeeting,
      hasRenunciation: officialReport.hasRenunciation,
      justiceDepartmentContactId: officialReport.justiceDepartmentContactId,
      manuallyEditedPart: {
        intro: isDefined(officialReport.introHtml?.trim() || undefined),
        conclusion: isDefined(officialReport.conclusionHtml?.trim() || undefined),
      },
    });

    return OfficialReport.from({
      id: officialReportId,
      snapshot: snapshot,
    });
  }

  /**
   * Streaming the files to compute their projected version as {@link PlainOfficialReportSnapshotFile}.
   *
   * This is intended as a memory-efficient process, since we don't need the whole object.
   * Especially `editedHtml` which is potentially large)
   */
  private async findOfficialReportFiles(query: {
    id: string;
  }): Promise<Map<string, OfficialReportSnapshotFile>> {
    const map = new Map<string, OfficialReportSnapshotFile>();
    let cursor: bigint | undefined = undefined;

    do {
      const files: {
        id: bigint;
        outcome: PrismaDocsFileOutcomeEnum;
        outcomeComment: string | null;
        htmlEdited: string | null;
        nominationFileId: string | null;
        reporters: string[];
      }[] = await this.db.tx.officialReportNominationFile.findMany({
        where: { officialReportId: query.id },
        orderBy: { id: 'asc' },
        skip: isDefined(cursor) ? 1 : 0,
        cursor: isDefined(cursor) ? { id: cursor } : undefined,
        take: 25,
        select: {
          id: true,
          outcome: true,
          outcomeComment: true,
          reporters: true,
          htmlEdited: true,
          nominationFileId: true,
        },
      });

      cursor = files.at(-1)?.id;

      for (const file of files) {
        if (!file.nominationFileId) continue;

        map.set(
          file.nominationFileId,
          OfficialReportSnapshotFile.from({
            id: file.id,
            outcome: { value: file.outcome, comment: file.outcomeComment },
            reporters: file.reporters,
            nominationFileId: file.nominationFileId,
            hasManuallyEditedHtml: (file.htmlEdited ?? '').trim().length > 0,
          }),
        );
      }
    } while (isDefined(cursor));

    return map;
  }

  @Transactional(Propagation.Mandatory)
  async persist(report: OfficialReport): Promise<void> {
    for (const message of report.messages) {
      if (message instanceof OfficialReportCreated) {
        await this.persistOfficialReportCreated(message);
      } else if (message instanceof OfficialReportUpdated) {
        await this.persistOfficialReportUpdated(message);
      } else if (message instanceof OfficialReportDeleted) {
        await this.persistOfficialReportDeleted(message);
      } else if (message instanceof OfficialReportDocumentReset) {
        await this.persistOfficialReportDocumentReset(message);
      } else if (message instanceof OfficialReportIntroEdited) {
        await this.persistOfficialReportIntroEdited(message);
      } else if (message instanceof OfficialReportIntroReset) {
        await this.persistOfficialReportIntroReset(message);
      } else if (message instanceof OfficialReportConclusionEdited) {
        await this.persistOfficialReportConclusionEdited(message);
      } else if (message instanceof OfficialReportConclusionReset) {
        await this.persistOfficialReportConclusionReset(message);
      } else if (message instanceof OfficialReportFileEdited) {
        await this.persistOfficialReportFileEdited(message);
      } else if (message instanceof OfficialReportFileReset) {
        await this.persistOfficialReportFileReset(message);
      } else if (message instanceof OfficialReportSectionTitleEdited) {
        await this.persistOfficialReportSectionTitleEdited(message);
      } else if (message instanceof OfficialReportSectionTitleReset) {
        await this.persistOfficialReportSectionTitleReset(message);
      } else if (message instanceof OfficialReportSectionIntroEdited) {
        await this.persistOfficialReportSectionIntroEdited(message);
      } else if (message instanceof OfficialReportSectionIntroReset) {
        await this.persistOfficialReportSectionIntroReset(message);
      } else if (message instanceof OfficialReportInvalidated) {
        await this.persistOfficialReportInvalidated(message);
      } else {
        assertNever(message);
      }
    }
  }

  private async persistOfficialReportCreated(message: OfficialReportCreated) {
    const justiceContact = await this.resolveJusticeContact(message.snapshot.meta.justiceDepartmentContactId);
    const nominationFiles = await this.resolveAgendaNominationFiles(message);

    await this.db.tx.officialReport.create({
      data: {
        ...this.metadata({
          justiceContact,
          id: message.id,
          authorId: message.authorId,
          snapshot: message.snapshot.meta,
        }),

        html: null,
        members: { createMany: { data: this.memberData(message.snapshot.meta) } },
        nominationFiles: { createMany: { data: nominationFiles } },
      },
    });
  }

  private async persistOfficialReportUpdated(message: OfficialReportUpdated) {
    const justiceContact = await this.resolveJusticeContact(message.snapshot.justiceDepartmentContactId);
    await this.db.tx.officialReportMember.deleteMany({ where: { officialReportId: message.id } });

    await this.db.tx.officialReport.update({
      where: { id: message.id },
      data: {
        ...this.metadata({
          justiceContact,
          id: message.id,
          authorId: message.authorId,
          snapshot: message.snapshot,
        }),

        members: { createMany: { data: this.memberData(message.snapshot) } },
      },
    });
  }

  private async persistOfficialReportInvalidated(message: OfficialReportInvalidated) {
    const filesToCreate = message.diff.files
      .filter((file) => file.action === 'create')
      .map((file) => file.nominationFileId);

    if (filesToCreate.length > 0) {
      const self = await this.db.tx.officialReport.findUniqueOrThrow({
        where: { id: message.officialReportId },
        select: { agendas: { select: { sessionId: true } } },
      });
      const { sessionId } = assertIsDefined(self.agendas[0]);
      const files = await this.resolveNominationFiles({
        sessionId,
        ids: filesToCreate,
        officialReportId: message.officialReportId,
      });

      await this.db.tx.officialReportNominationFile.createMany({
        data: files.map((file) => ({ ...file, officialReportId: message.officialReportId })),
      });
    }

    const filesToUpdate = message.diff.files.filter(
      (file): file is typeof file & { action: 'outdate' | 'update' } =>
        file.action === 'outdate' || file.action === 'update',
    );
    for (const file of filesToUpdate) {
      await this.db.tx.officialReportNominationFile.update({
        where: { id: file.id },
        data: {
          htmlOutdated: file.action === 'outdate',
          reporters: file.reporters as string[] | undefined,
          outcome: file.outcome,
          outcomeComment: file.outcomeComment,
        },
      });
    }

    await this.db.tx.officialReport.update({
      where: { id: message.officialReportId },
      data: {
        introOutdated: message.diff.intro === 'OUTDATED' ? true : undefined,
        conclusionOutdated: message.diff.conclusion === 'OUTDATED' ? true : undefined,
      },
    });

    if (message.diff.hasAny) await this.recomputeState(message.officialReportId);
  }

  private async resolveJusticeContact(
    justiceDepartmentContactId: bigint,
  ): Promise<{ id: bigint; name: string }> {
    const justiceContact = await this.db.tx.justiceDepartmentContact.findUnique({
      where: { id: justiceDepartmentContactId },
      select: { id: true, name: true },
    });

    if (!justiceContact) {
      this.logger.error(`Unknown justice contact "${justiceDepartmentContactId}"`);
      throw new InternalServerErrorException();
    }

    if (!justiceContact.name.trim()) {
      this.logger.error(`justice contact "${justiceDepartmentContactId}" name is empty`);
      throw new InternalServerErrorException();
    }

    return justiceContact;
  }

  private async resolveAgendaNominationFiles(
    message: OfficialReportCreated | OfficialReportUpdated,
  ): Promise<Prisma.OfficialReportNominationFileUncheckedCreateWithoutOfficialReportInput[]> {
    const agenda = await this.db.tx.agenda.findUnique({
      where: {
        id:
          message instanceof OfficialReportCreated
            ? message.snapshot.meta.agenda.id
            : message.snapshot.agenda.id,
      },
      select: {
        sessionId: true,
        nominationFiles: {
          select: { nominationFileId: true },
          where: { nominationFileId: { not: null } },
        },
      },
    });

    if (!agenda) return [];

    return this.resolveNominationFiles({
      sessionId: agenda.sessionId,
      officialReportId: message.id,
      ids: agenda.nominationFiles.flatMap((file) => (file.nominationFileId ? [file.nominationFileId] : [])),
    });
  }

  private async resolveNominationFiles(query: {
    sessionId: string;
    ids: readonly string[];
    officialReportId: string;
  }) {
    const { items } = await this.nominationFilesFinder.findNonReported({
      ids: query.ids,
      sessionId: query.sessionId,
      ignoreOfficialReportId: query.officialReportId,
    });

    return items
      .filter((file) => OfficialReportRepository.hasOutcome(file))
      .map((f) => ({
        nominationFileId: f.id,
        number: f.number,
        name: f.magistrat.name,
        grade: f.magistrat.position.grade,
        position: f.magistrat.position.label,
        targetedPosition: f.targetPosition.label,
        targetedGrade: f.targetPosition.grade,
        outcome: f.outcome.value,
        outcomeComment: f.outcome.comment,
        reporters: f.reporters.map((r) => r.fullTitledName),
      }));
  }

  private metadata(props: {
    id: string;
    authorId: string;
    snapshot: OfficialReportSnapshotMeta;
    justiceContact: { id: bigint; name: string };
  }): Prisma.OfficialReportUncheckedCreateInput {
    const { id, authorId, snapshot, justiceContact } = props;

    return {
      id,
      authorId,

      sessionMeetingDate: snapshot.sessionMeeting.date.toDate(),
      sessionMeetingStartingTime: timeOnlyToDate(snapshot.sessionMeeting.start),
      sessionMeetingEndingTime: timeOnlyToDate(snapshot.sessionMeeting.end),

      hasRenunciation: snapshot.hasRenunciation,
      justiceDepartmentContactId: justiceContact.id,
      justiceDepartmentContactName: justiceContact.name,

      chairmanId: snapshot.chairman.id,
      chairmanFirstName: snapshot.chairman.firstName,
      chairmanLastName: snapshot.chairman.lastName,
      chairmanGender: snapshot.chairman.gender,
      chairmanTitle: snapshot.chairman.title,
      chairmanDisplayTitle: snapshot.chairman.displayTitle,

      secretaryId: snapshot.secretary.id,
      secretaryFirstName: snapshot.secretary.firstName,
      secretaryLastName: snapshot.secretary.lastName,
      secretaryGender: snapshot.secretary.gender,
      secretaryTitle: snapshot.secretary.title,
      secretaryDisplayTitle: snapshot.secretary.displayTitle,

      agendas: { connect: { id: snapshot.agenda.id } },
    };
  }

  private memberData(snapshot: {
    members: OfficialReportMembersList;
  }): Prisma.OfficialReportMemberCreateManyOfficialReportInput[] {
    return snapshot.members.map((m) => ({
      memberId: m.id,
      firstName: m.firstName,
      lastName: m.lastName,
      gender: m.gender,
      title: m.displayTitle,
      isAbsent: m.isAbsent,
      sort: m.sort,
    }));
  }

  private async persistOfficialReportDocumentReset(message: OfficialReportDocumentReset) {
    await this.recomputeState(message.officialReportId);
  }

  private async persistOfficialReportIntroEdited(message: OfficialReportIntroEdited) {
    await this.db.tx.officialReport.update({
      where: { id: message.officialReportId },
      data: {
        introHtml: message.html,
        introOutdated: message.outdated,
      },
    });

    await this.recomputeState(message.officialReportId);
  }

  private async persistOfficialReportIntroReset(message: OfficialReportIntroReset) {
    await this.db.tx.officialReport.update({
      where: { id: message.officialReportId },
      data: { introHtml: null, introOutdated: false, html: null, pdfId: null },
    });

    await this.recomputeState(message.officialReportId);
  }

  private async persistOfficialReportConclusionEdited(message: OfficialReportConclusionEdited) {
    await this.db.tx.officialReport.update({
      where: { id: message.officialReportId },
      data: {
        conclusionHtml: message.html,
        conclusionOutdated: message.outdated,
      },
    });

    await this.recomputeState(message.officialReportId);
  }

  private async persistOfficialReportConclusionReset(message: OfficialReportConclusionReset) {
    await this.db.tx.officialReport.update({
      where: { id: message.officialReportId },
      data: { conclusionHtml: null, conclusionOutdated: false, html: null, pdfId: null },
    });

    await this.recomputeState(message.officialReportId);
  }

  private async persistOfficialReportFileEdited(message: OfficialReportFileEdited) {
    await this.db.tx.officialReportNominationFile.updateMany({
      where: { officialReportId: message.officialReportId, nominationFileId: message.nominationFileId },
      data: { htmlEdited: message.html, htmlOutdated: message.outdated },
    });

    await this.recomputeState(message.officialReportId);
  }

  private async persistOfficialReportFileReset(message: OfficialReportFileReset) {
    await this.db.tx.officialReportNominationFile.updateMany({
      where: { officialReportId: message.officialReportId, nominationFileId: message.nominationFileId },
      data: { htmlEdited: null, htmlOutdated: false },
    });

    await this.recomputeState(message.officialReportId);
  }

  private async persistOfficialReportSectionTitleEdited(message: OfficialReportSectionTitleEdited) {
    await this.db.tx.officialReportSectionTitle.upsert({
      where: { primaryKey: { officialReportId: message.officialReportId, outcome: message.outcome } },
      create: { officialReportId: message.officialReportId, outcome: message.outcome, title: message.text },
      update: { title: message.text },
    });

    await this.recomputeState(message.officialReportId);
  }

  private async persistOfficialReportSectionTitleReset(message: OfficialReportSectionTitleReset) {
    await this.db.tx.officialReportSectionTitle.deleteMany({
      where: { officialReportId: message.officialReportId, outcome: message.outcome },
    });

    await this.recomputeState(message.officialReportId);
  }

  private async persistOfficialReportSectionIntroEdited(message: OfficialReportSectionIntroEdited) {
    await this.db.tx.officialReportSectionIntro.upsert({
      where: { primaryKey: { officialReportId: message.officialReportId, outcome: message.outcome } },
      create: { officialReportId: message.officialReportId, outcome: message.outcome, html: message.html },
      update: { html: message.html },
    });

    await this.recomputeState(message.officialReportId);
  }

  private async persistOfficialReportSectionIntroReset(message: OfficialReportSectionIntroReset) {
    await this.db.tx.officialReportSectionIntro.deleteMany({
      where: { officialReportId: message.officialReportId, outcome: message.outcome },
    });

    await this.recomputeState(message.officialReportId);
  }

  private async recomputeState(id: Id<'OfficialReportId'>): Promise<void> {
    await this.recomputeOutdated(id);
    await this.recomputeManuallyEdited(id);
    await this.resetDocumentData(id);
  }

  private async resetDocumentData(id: string): Promise<void> {
    const report = await this.db.tx.officialReport.findUnique({
      where: { id },
      select: { pdf: { select: { id: true, path: true } } },
    });
    await this.db.tx.officialReport.update({ where: { id }, data: { html: null, pdfId: null } });

    if (!report || !report.pdf) return;
    this.files.delete([{ id: report.pdf.id, path: report.pdf.path }]);
  }

  private async recomputeManuallyEdited(id: string): Promise<void> {
    const manuallyEditedOfficialReport = await this.db.tx.officialReport.findFirst({
      select: { id: true },
      where: {
        id,
        OR: [
          { introHtml: { not: null } },
          { conclusionHtml: { not: null } },
          { nominationFiles: { some: { htmlEdited: { not: null } } } },
          { sectionIntros: { some: {} } },
          { sectionTitles: { some: { title: { not: null } } } },
        ],
      },
    });

    await this.db.tx.officialReport.update({
      where: { id },
      data: { isManuallyEdited: isDefined(manuallyEditedOfficialReport) },
    });
  }

  private async recomputeOutdated(id: string): Promise<void> {
    const outdatedOfficialReport = await this.db.tx.officialReport.findFirst({
      select: { id: true },
      where: {
        id,
        OR: [
          { introOutdated: true },
          { conclusionOutdated: true },
          { nominationFiles: { some: { htmlOutdated: true } } },
        ],
      },
    });

    await this.db.tx.officialReport.update({
      where: { id },
      data: { outdated: isDefined(outdatedOfficialReport) },
    });
  }

  private async persistOfficialReportDeleted(message: OfficialReportDeleted) {
    await this.db.tx.agenda.updateMany({
      where: { officialReportId: message.officialReportId },
      data: { officialReportId: null },
    });

    const report = await this.db.tx.officialReport.findUnique({
      where: { id: message.officialReportId },
      select: { pdfId: true },
    });

    await this.db.tx.officialReport.delete({
      where: { id: message.officialReportId },
    });

    if (report?.pdfId) {
      await this.db.tx.file.deleteMany({
        where: { id: report.pdfId },
      });
    }
  }

  private static hasOutcome<
    T extends { outcome: { value: DocNominationFileOutcomeEnum; comment: string | null } | null },
  >(file: T): file is T & { outcome: NonNullable<T['outcome']> } {
    return isDefined(file.outcome);
  }
}
