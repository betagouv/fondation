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
import { PrismaService } from 'src/modules/framework/database';
import { Files } from 'src/modules/framework/files';
import { SessionService } from 'src/modules/session/infrastructure/sessions.service';
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
    private readonly prisma: PrismaService,
    private readonly nominationFilesFinder: DocsNominationFilesFinder,
    private readonly files: Files,

    @Inject(forwardRef(() => SessionService))
    private readonly sessions: SessionService,
  ) {}

  async find(query: { id: string; tx?: Prisma.TransactionClient }): Promise<OfficialReport> {
    if (!query.tx) return this.prisma.$transaction((tx) => this.find({ ...query, tx }));

    const officialReport = await query.tx.officialReport.findUnique({
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

    const { date } = await this.sessions.details({ sessionId: rawAgenda.sessionId, tx: query.tx });

    const agenda = OfficialReportAgenda.from({
      ignoreOfficialReportId: officialReportId,
      agenda: {
        id: rawAgenda.id,
        officialReportId: rawAgenda.officialReportId,
        date: DateOnly.fromDate(rawAgenda.date),
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

    const files = await this.findOfficialReportFiles({ id: query.id, tx: query.tx });

    const sessionMeeting = OfficialReportSessionMeeting.from({
      date: DateOnly.fromDate(officialReport.sessionMeetingDate),
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
    tx: Prisma.TransactionClient;
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
      }[] = await query.tx.officialReportNominationFile.findMany({
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

  async persist(report: OfficialReport, tx?: Prisma.TransactionClient): Promise<void> {
    if (!tx) return this.prisma.$transaction((tx) => this.persist(report, tx));

    for (const message of report.messages) {
      if (message instanceof OfficialReportCreated) {
        await this.persistOfficialReportCreated(tx, message);
      } else if (message instanceof OfficialReportUpdated) {
        await this.persistOfficialReportUpdated(tx, message);
      } else if (message instanceof OfficialReportDeleted) {
        await this.persistOfficialReportDeleted(tx, message);
      } else if (message instanceof OfficialReportDocumentReset) {
        await this.persistOfficialReportDocumentReset(tx, message);
      } else if (message instanceof OfficialReportIntroEdited) {
        await this.persistOfficialReportIntroEdited(tx, message);
      } else if (message instanceof OfficialReportIntroReset) {
        await this.persistOfficialReportIntroReset(tx, message);
      } else if (message instanceof OfficialReportConclusionEdited) {
        await this.persistOfficialReportConclusionEdited(tx, message);
      } else if (message instanceof OfficialReportConclusionReset) {
        await this.persistOfficialReportConclusionReset(tx, message);
      } else if (message instanceof OfficialReportFileEdited) {
        await this.persistOfficialReportFileEdited(tx, message);
      } else if (message instanceof OfficialReportFileReset) {
        await this.persistOfficialReportFileReset(tx, message);
      } else if (message instanceof OfficialReportSectionTitleEdited) {
        await this.persistOfficialReportSectionTitleEdited(tx, message);
      } else if (message instanceof OfficialReportSectionTitleReset) {
        await this.persistOfficialReportSectionTitleReset(tx, message);
      } else if (message instanceof OfficialReportSectionIntroEdited) {
        await this.persistOfficialReportSectionIntroEdited(tx, message);
      } else if (message instanceof OfficialReportSectionIntroReset) {
        await this.persistOfficialReportSectionIntroReset(tx, message);
      } else if (message instanceof OfficialReportInvalidated) {
        await this.persistOfficialReportInvalidated(tx, message);
      } else {
        assertNever(message);
      }
    }
  }

  private async persistOfficialReportCreated(tx: Prisma.TransactionClient, message: OfficialReportCreated) {
    const justiceContact = await this.resolveJusticeContact(
      tx,
      message.snapshot.meta.justiceDepartmentContactId,
    );
    const nominationFiles = await this.resolveAgendaNominationFiles(tx, message);

    await tx.officialReport.create({
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

  private async persistOfficialReportUpdated(tx: Prisma.TransactionClient, message: OfficialReportUpdated) {
    const justiceContact = await this.resolveJusticeContact(tx, message.snapshot.justiceDepartmentContactId);
    await tx.officialReportMember.deleteMany({ where: { officialReportId: message.id } });

    await tx.officialReport.update({
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

  private async persistOfficialReportInvalidated(
    tx: Prisma.TransactionClient,
    message: OfficialReportInvalidated,
  ) {
    const filesToCreate = message.diff.files
      .filter((file) => file.action === 'create')
      .map((file) => file.nominationFileId);

    if (filesToCreate.length > 0) {
      const self = await tx.officialReport.findUniqueOrThrow({
        where: { id: message.officialReportId },
        select: { agendas: { select: { sessionId: true } } },
      });
      const { sessionId } = assertIsDefined(self.agendas[0]);
      const files = await this.resolveNominationFiles({
        tx,
        sessionId,
        ids: filesToCreate,
        officialReportId: message.officialReportId,
      });

      await tx.officialReportNominationFile.createMany({
        data: files.map((file) => ({ ...file, officialReportId: message.officialReportId })),
      });
    }

    const filesToUpdate = message.diff.files.filter(
      (file): file is typeof file & { action: 'outdate' | 'update' } =>
        file.action === 'outdate' || file.action === 'update',
    );
    for (const file of filesToUpdate) {
      await tx.officialReportNominationFile.update({
        where: { id: file.id },
        data: {
          htmlOutdated: file.action === 'outdate',
          reporters: file.reporters as string[] | undefined,
          outcome: file.outcome,
          outcomeComment: file.outcomeComment,
        },
      });
    }

    await tx.officialReport.update({
      where: { id: message.officialReportId },
      data: {
        outdated: message.diff.hasAny,
        introOutdated: message.diff.intro === 'OUTDATED' ? true : undefined,
        conclusionOutdated: message.diff.conclusion === 'OUTDATED' ? true : undefined,
      },
    });
  }

  private async resolveJusticeContact(
    tx: Prisma.TransactionClient,
    justiceDepartmentContactId: bigint,
  ): Promise<{ id: bigint; name: string }> {
    const justiceContact = await tx.justiceDepartmentContact.findUnique({
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
    tx: Prisma.TransactionClient,
    message: OfficialReportCreated | OfficialReportUpdated,
  ): Promise<Prisma.OfficialReportNominationFileUncheckedCreateWithoutOfficialReportInput[]> {
    const agenda = await tx.agenda.findUnique({
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
      tx,
      sessionId: agenda.sessionId,
      officialReportId: message.id,
      ids: agenda.nominationFiles.flatMap((file) => (file.nominationFileId ? [file.nominationFileId] : [])),
    });
  }

  private async resolveNominationFiles(query: {
    tx: Prisma.TransactionClient;
    sessionId: string;
    ids: readonly string[];
    officialReportId: string;
  }) {
    const { items } = await this.nominationFilesFinder.findNonReported({
      tx: query.tx,
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

  private async persistOfficialReportDocumentReset(
    tx: Prisma.TransactionClient,
    message: OfficialReportDocumentReset,
  ) {
    await this.recomputeState(tx, message.officialReportId);
  }

  private async persistOfficialReportIntroEdited(
    tx: Prisma.TransactionClient,
    message: OfficialReportIntroEdited,
  ) {
    await tx.officialReport.update({
      where: { id: message.officialReportId },
      data: {
        introHtml: message.html,
        introOutdated: message.outdated,
      },
    });

    await this.recomputeState(tx, message.officialReportId);
  }

  private async persistOfficialReportIntroReset(
    tx: Prisma.TransactionClient,
    message: OfficialReportIntroReset,
  ) {
    await tx.officialReport.update({
      where: { id: message.officialReportId },
      data: { introHtml: null, introOutdated: false, html: null, pdfId: null },
    });

    await this.recomputeState(tx, message.officialReportId);
  }

  private async persistOfficialReportConclusionEdited(
    tx: Prisma.TransactionClient,
    message: OfficialReportConclusionEdited,
  ) {
    await tx.officialReport.update({
      where: { id: message.officialReportId },
      data: {
        conclusionHtml: message.html,
        conclusionOutdated: message.outdated,
      },
    });

    await this.recomputeState(tx, message.officialReportId);
  }

  private async persistOfficialReportConclusionReset(
    tx: Prisma.TransactionClient,
    message: OfficialReportConclusionReset,
  ) {
    await tx.officialReport.update({
      where: { id: message.officialReportId },
      data: { conclusionHtml: null, conclusionOutdated: false, html: null, pdfId: null },
    });

    await this.recomputeState(tx, message.officialReportId);
  }

  private async persistOfficialReportFileEdited(
    tx: Prisma.TransactionClient,
    message: OfficialReportFileEdited,
  ) {
    await tx.officialReportNominationFile.updateMany({
      where: { officialReportId: message.officialReportId, nominationFileId: message.nominationFileId },
      data: { htmlEdited: message.html, htmlOutdated: message.outdated },
    });

    await this.recomputeState(tx, message.officialReportId);
  }

  private async persistOfficialReportFileReset(
    tx: Prisma.TransactionClient,
    message: OfficialReportFileReset,
  ) {
    await tx.officialReportNominationFile.updateMany({
      where: { officialReportId: message.officialReportId, nominationFileId: message.nominationFileId },
      data: { htmlEdited: null, htmlOutdated: false },
    });

    await this.recomputeState(tx, message.officialReportId);
  }

  private async persistOfficialReportSectionTitleEdited(
    tx: Prisma.TransactionClient,
    message: OfficialReportSectionTitleEdited,
  ) {
    await tx.officialReportSectionTitle.upsert({
      where: { primaryKey: { officialReportId: message.officialReportId, outcome: message.outcome } },
      create: { officialReportId: message.officialReportId, outcome: message.outcome, title: message.text },
      update: { title: message.text },
    });

    await this.recomputeState(tx, message.officialReportId);
  }

  private async persistOfficialReportSectionTitleReset(
    tx: Prisma.TransactionClient,
    message: OfficialReportSectionTitleReset,
  ) {
    await tx.officialReportSectionTitle.deleteMany({
      where: { officialReportId: message.officialReportId, outcome: message.outcome },
    });

    await this.recomputeState(tx, message.officialReportId);
  }

  private async persistOfficialReportSectionIntroEdited(
    tx: Prisma.TransactionClient,
    message: OfficialReportSectionIntroEdited,
  ) {
    await tx.officialReportSectionIntro.upsert({
      where: { primaryKey: { officialReportId: message.officialReportId, outcome: message.outcome } },
      create: { officialReportId: message.officialReportId, outcome: message.outcome, html: message.html },
      update: { html: message.html },
    });

    await this.recomputeState(tx, message.officialReportId);
  }

  private async persistOfficialReportSectionIntroReset(
    tx: Prisma.TransactionClient,
    message: OfficialReportSectionIntroReset,
  ) {
    await tx.officialReportSectionIntro.deleteMany({
      where: { officialReportId: message.officialReportId, outcome: message.outcome },
    });

    await this.recomputeState(tx, message.officialReportId);
  }

  private async recomputeState(tx: Prisma.TransactionClient, id: Id<'OfficialReportId'>): Promise<void> {
    await OfficialReportRepository.recomputeOutdated(tx, id);
    await OfficialReportRepository.recomputeManuallyEdited(tx, id);
    await this.resetDocumentData(tx, id);
  }

  private async resetDocumentData(tx: Prisma.TransactionClient, id: string): Promise<void> {
    const report = await tx.officialReport.findUnique({
      where: { id },
      select: { pdf: { select: { id: true, path: true } } },
    });
    await tx.officialReport.update({ where: { id }, data: { html: null, pdfId: null } });

    if (!report || !report.pdf) return;
    this.files.delete([{ id: report.pdf.id, path: report.pdf.path }]);
  }

  private static async recomputeManuallyEdited(tx: Prisma.TransactionClient, id: string): Promise<void> {
    const manuallyEditedOfficialReport = await tx.officialReport.findFirst({
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

    await tx.officialReport.update({
      where: { id },
      data: { isManuallyEdited: isDefined(manuallyEditedOfficialReport) },
    });
  }

  private static async recomputeOutdated(tx: Prisma.TransactionClient, id: string): Promise<void> {
    const outdatedOfficialReport = await tx.officialReport.findFirst({
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

    await tx.officialReport.update({ where: { id }, data: { outdated: isDefined(outdatedOfficialReport) } });
  }

  private async persistOfficialReportDeleted(tx: Prisma.TransactionClient, message: OfficialReportDeleted) {
    await tx.agenda.updateMany({
      where: { officialReportId: message.officialReportId },
      data: { officialReportId: null },
    });

    const report = await tx.officialReport.findUnique({
      where: { id: message.officialReportId },
      select: { pdfId: true },
    });

    await tx.officialReport.delete({
      where: { id: message.officialReportId },
    });

    if (report?.pdfId) {
      await tx.file.deleteMany({
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
