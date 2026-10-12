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
import { AGENDA_CONTENT_VERSIONS, agendaContentOf } from '../../../shared/infrastructure/agenda-content';
import { DocsNominationFilesFinder } from '../../../shared/infrastructure/finders/docs-nomination-files.finder';
import {
  OfficialReport,
  OfficialReportConclusionEdited,
  OfficialReportConclusionReset,
  OfficialReportCreated,
  OfficialReportDeleted,
  OfficialReportFileReset,
  OfficialReportIntroEdited,
  OfficialReportIntroReset,
  OfficialReportDraftDiscarded,
  OfficialReportDraftEdited,
  OfficialReportDraftOpened,
  OfficialReportDraftUpdatedBySystem,
  OfficialReportInvalidated,
  OfficialReportSectionIntroEdited,
  OfficialReportSectionIntroReset,
  OfficialReportSectionTitleEdited,
  OfficialReportSectionTitleReset,
  OfficialReportUpdated,
  OfficialReportUpdateSkipped,
  OfficialReportValidated,
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
import { OfficialReportVersionFinder } from '../finders/official-report-version.finder';
import { Prisma, PrismaDocsFileOutcomeEnum } from 'src/generated/prisma/client';
import { Clock } from 'src/modules/framework/clock';
import { Db } from 'src/modules/framework/database';
import { Files } from 'src/modules/framework/files';
import { TransparenceService } from 'src/modules/session/transparence/infrastructure/transparence.service';
import { prismaFormationEnumToFormationEnum } from 'src/modules/shared/mappers/formation.mapper';
import { prismaGenderEnumToGenderEnum } from 'src/modules/shared/mappers/gender-enum.mapper';
import { assertNever } from 'src/utils/assert-never';
import { DateOnly } from 'src/utils/date-only';
import { makeId } from 'src/utils/id';
import { assertIsDefined, isDefined } from 'src/utils/is-defined';
import { dateToTimeOnly, timeOnlyToDate } from 'src/utils/time-only';

@Injectable()
export class OfficialReportRepository {
  private readonly logger = new Logger(OfficialReportRepository.name);
  constructor(
    private readonly db: Db,
    private readonly clock: Clock,
    private readonly nominationFilesFinder: DocsNominationFilesFinder,
    private readonly files: Files,
    private readonly officialReportVersionFinder: OfficialReportVersionFinder,

    @Inject(forwardRef(() => TransparenceService))
    private readonly sessions: TransparenceService,
  ) {}

  @Transactional()
  async find(query: { actorId: string | null; id: string }): Promise<OfficialReport> {
    const versionId = await this.officialReportVersionFinder.latest({ officialReportId: query.id });
    const version = await this.db.tx.officialReportVersion.findUnique({
      where: { id: versionId },
      select: {
        chairmanDisplayTitle: true,
        chairmanFirstName: true,
        chairmanGender: true,
        chairmanId: true,
        chairmanLastName: true,
        chairmanTitle: true,
        conclusionHtml: true,
        hasRenunciation: true,
        introHtml: true,
        justiceDepartmentContactId: true,
        members: {
          select: {
            firstName: true,
            gender: true,
            id: true,
            isAbsent: true,
            lastName: true,
            memberId: true,
            sort: true,
            title: true,
          },
        },
        officialReport: {
          select: {
            agenda: {
              select: {
                formation: true,
                id: true,
                officialReportId: true,
                sessionId: true,
                versions: {
                  select: { date: true, status: true },
                  orderBy: { version: 'desc' },
                  take: 2,
                },
              },
            },
            id: true,
          },
        },
        pdfId: true,
        secretaryDisplayTitle: true,
        secretaryFirstName: true,
        secretaryGender: true,
        secretaryId: true,
        secretaryLastName: true,
        secretaryTitle: true,
        sessionMeetingDate: true,
        sessionMeetingEndingTime: true,
        sessionMeetingStartingTime: true,
        validatedAt: true,
      } satisfies Prisma.OfficialReportVersionSelect,
    });

    if (!version) throw new NotFoundException();
    const officialReport = { ...version, ...version.officialReport };

    const officialReportId = makeId('OfficialReportId', officialReport.id);
    const rawAgenda = assertIsDefined(officialReport.agenda, `Official Report "${query.id}" has no agenda`);
    // the report speaks of the agenda as it was validated, and of its draft only while the agenda
    // has never been validated, which is the one case where nothing else exists to speak of
    const agendaDate = assertIsDefined(
      agendaContentOf(rawAgenda.versions)?.date,
      `Official Report "${query.id}" has no agenda version`,
    );

    const { date } = await this.sessions.internalGetSession({ sessionId: rawAgenda.sessionId });

    const agenda = OfficialReportAgenda.from({
      agenda: {
        date: DateOnly.fromUtcDate(agendaDate),
        formation: prismaFormationEnumToFormationEnum(rawAgenda.formation),
        id: rawAgenda.id,
        officialReportId: rawAgenda.officialReportId,
        session: { date, id: rawAgenda.sessionId },
      },
      ignoreOfficialReportId: officialReportId,
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
      endTime: dateToTimeOnly(officialReport.sessionMeetingEndingTime),
      startTime: dateToTimeOnly(officialReport.sessionMeetingStartingTime),
    });

    const snapshot = OfficialReportSnapshot.from({
      agenda,
      chairman,
      files,
      hasRenunciation: officialReport.hasRenunciation,
      justiceDepartmentContactId: officialReport.justiceDepartmentContactId,
      manuallyEditedPart: {
        conclusion: isDefined(officialReport.conclusionHtml?.trim() || undefined),
        intro: isDefined(officialReport.introHtml?.trim() || undefined),
      },
      members,
      secretary,
      sessionMeeting,
    });

    return OfficialReport.from({
      actorId: query.actorId ?? null,
      id: officialReportId,
      isDocumentStored: isDefined(officialReport.pdfId),
      isValidated: isDefined(officialReport.validatedAt),
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
        htmlEdited: string | null;
        htmlFromAgenda: boolean;
        id: bigint;
        nominationFileId: string | null;
        outcome: PrismaDocsFileOutcomeEnum;
        outcomeComment: string | null;
        reporters: string[];
      }[] = await this.db.tx.officialReportNominationFile.findMany({
        where: { versionId: await this.officialReportVersionFinder.latest({ officialReportId: query.id }) },
        select: {
          htmlEdited: true,
          htmlFromAgenda: true,
          id: true,
          nominationFileId: true,
          outcome: true,
          outcomeComment: true,
          reporters: true,
        } satisfies Prisma.OfficialReportNominationFileSelect,
        orderBy: { id: 'asc' },
        cursor: isDefined(cursor) ? { id: cursor } : undefined,
        skip: isDefined(cursor) ? 1 : 0,
        take: 25,
      });

      cursor = files.at(-1)?.id;

      for (const file of files) {
        if (!file.nominationFileId) continue;

        map.set(
          file.nominationFileId,
          OfficialReportSnapshotFile.from({
            // a sentence taken from the agenda is the agenda's to keep up to date, not the report's
            hasManuallyEditedHtml: !file.htmlFromAgenda && (file.htmlEdited ?? '').trim().length > 0,
            nominationFileId: file.nominationFileId,
            outcome: { comment: file.outcomeComment, value: file.outcome },
            reporters: file.reporters,
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
      } else if (message instanceof OfficialReportIntroEdited) {
        await this.persistOfficialReportIntroEdited(message);
      } else if (message instanceof OfficialReportIntroReset) {
        await this.persistOfficialReportIntroReset(message);
      } else if (message instanceof OfficialReportConclusionEdited) {
        await this.persistOfficialReportConclusionEdited(message);
      } else if (message instanceof OfficialReportConclusionReset) {
        await this.persistOfficialReportConclusionReset(message);
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
      } else if (message instanceof OfficialReportValidated) {
        await this.persistOfficialReportValidated(message);
      } else if (message instanceof OfficialReportInvalidated) {
        await this.persistOfficialReportInvalidated(message);
      } else if (message instanceof OfficialReportDraftOpened) {
        await this.persistOfficialReportDraftOpened(message);
      } else if (message instanceof OfficialReportDraftDiscarded) {
        await this.persistOfficialReportDraftDiscarded(message);
      } else if (message instanceof OfficialReportDraftEdited) {
        await this.persistOfficialReportDraftEdited(message);
      } else if (message instanceof OfficialReportDraftUpdatedBySystem) {
        await this.persistOfficialReportDraftUpdatedBySystem(message);
      } else if (message instanceof OfficialReportUpdateSkipped) {
        await this.persistOfficialReportUpdateSkipped(message);
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
        agenda: { connect: { id: message.snapshot.meta.agenda.id } },
        authorId: message.authorId,
        id: message.id,
        versions: {
          create: {
            ...this.versionContent({ justiceContact, snapshot: message.snapshot.meta }),
            createdBy: message.authorId,
            id: makeId('OfficialReportVersionId'),
            members: { createMany: { data: this.memberData(message.snapshot.meta) } },
            nominationFiles: { createMany: { data: nominationFiles } },
            version: 1,
          },
        },
      },
    });
  }

  private async persistOfficialReportUpdated(message: OfficialReportUpdated) {
    const justiceContact = await this.resolveJusticeContact(message.snapshot.justiceDepartmentContactId);
    const versionId = await this.officialReportVersionFinder.latest({ officialReportId: message.id });

    await this.db.tx.officialReportMember.deleteMany({ where: { versionId } });
    await this.db.tx.officialReportVersion.update({
      where: { id: versionId },
      data: {
        ...this.versionContent({ justiceContact, snapshot: message.snapshot }),
        members: { createMany: { data: this.memberData(message.snapshot) } },
      },
    });

    await this.recomputeState(versionId);
  }

  private async persistOfficialReportInvalidated(message: OfficialReportInvalidated) {
    const filesToCreate = message.diff.files
      .filter((file) => file.action === 'create')
      .map((file) => file.nominationFileId);

    if (filesToCreate.length > 0) {
      const self = await this.db.tx.officialReport.findUniqueOrThrow({
        where: { id: message.officialReportId },
        select: {
          agenda: {
            select: {
              sessionId: true,
              versions: {
                ...AGENDA_CONTENT_VERSIONS,
                select: {
                  nominationFiles: {
                    where: { htmlEdited: { not: null }, nominationFileId: { in: filesToCreate } },
                    select: {
                      htmlEdited: true,
                      htmlEditedAt: true,
                      htmlEditedBy: true,
                      nominationFileId: true,
                    },
                  },
                  status: true,
                },
              },
            },
          },
        } satisfies Prisma.OfficialReportSelect,
      });
      const rawAgenda = assertIsDefined(self.agenda);
      const { sessionId } = rawAgenda;
      const versionId = await this.officialReportVersionFinder.latest(message);
      const files = await this.resolveNominationFiles({
        // a file joining the report late takes the agenda block as it stands, like the others did
        agendaEditions: new Map(
          agendaContentOf(rawAgenda.versions)?.nominationFiles.flatMap((file) =>
            file.nominationFileId && file.htmlEdited
              ? [
                  [
                    file.nominationFileId,
                    { at: file.htmlEditedAt, by: file.htmlEditedBy, html: file.htmlEdited },
                  ] as const,
                ]
              : [],
          ) ?? [],
        ),
        ids: filesToCreate,
        sessionId,
      });

      await this.db.tx.officialReportNominationFile.createMany({
        data: files.map((file) => ({ ...file, versionId })),
      });
    }

    const editedVersionId = await this.officialReportVersionFinder.latest(message);

    const filesToUpdate = message.diff.files.filter(
      (file): file is typeof file & { action: 'outdate' | 'update' } =>
        file.action === 'outdate' || file.action === 'update',
    );
    // the snapshot was read before the draft was opened, so its row ids name the version being
    // replaced: the proposition is what the write follows from one version to the next
    for (const file of filesToUpdate) {
      await this.db.tx.officialReportNominationFile.updateMany({
        where: { nominationFileId: file.nominationFileId, versionId: editedVersionId },
        data: {
          htmlOutdated: file.action === 'outdate',
          outcome: file.outcome,
          outcomeComment: file.outcomeComment,
          reporters: file.reporters as string[] | undefined,
        },
      });
    }

    const filesToDelete = message.diff.files
      .filter((file) => file.action === 'delete')
      .map((file) => file.nominationFileId);

    if (filesToDelete.length > 0) {
      await this.db.tx.officialReportNominationFile.deleteMany({
        where: { nominationFileId: { in: filesToDelete }, versionId: editedVersionId },
      });
    }

    await this.db.tx.officialReportVersion.update({
      where: { id: editedVersionId },
      data: {
        conclusionOutdated: message.diff.conclusion === 'OUTDATED' ? true : undefined,
        introOutdated: message.diff.intro === 'OUTDATED' ? true : undefined,
      },
    });

    if (message.diff.hasAny) await this.recomputeState(editedVersionId);
  }

  private async resolveJusticeContact(
    justiceDepartmentContactId: bigint,
  ): Promise<{ id: bigint; name: string }> {
    const justiceContact = await this.db.tx.justiceDepartmentContact.findUnique({
      where: { id: justiceDepartmentContactId },
      select: { id: true, name: true } satisfies Prisma.JusticeDepartmentContactSelect,
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
  ): Promise<Prisma.OfficialReportNominationFileUncheckedCreateWithoutVersionInput[]> {
    const agenda = await this.db.tx.agenda.findUnique({
      where: {
        id:
          message instanceof OfficialReportCreated
            ? message.snapshot.meta.agenda.id
            : message.snapshot.agenda.id,
      },
      select: {
        sessionId: true,
        versions: {
          ...AGENDA_CONTENT_VERSIONS,
          select: {
            nominationFiles: {
              where: { nominationFileId: { not: null } },
              select: { htmlEdited: true, htmlEditedAt: true, htmlEditedBy: true, nominationFileId: true },
            },
            status: true,
          },
        },
      } satisfies Prisma.AgendaSelect,
    });

    if (!agenda) return [];

    const published = agendaContentOf(agenda.versions);
    if (!published) return [];

    // the two documents write the very same sentence for a file, so a block the agenda carries by
    // hand is taken as is. From then on the report owns its copy: later agenda editions leave it be.
    const agendaEditions = new Map(
      published.nominationFiles.flatMap((file) =>
        file.nominationFileId && file.htmlEdited
          ? [
              [
                file.nominationFileId,
                { at: file.htmlEditedAt, by: file.htmlEditedBy, html: file.htmlEdited },
              ] as const,
            ]
          : [],
      ),
    );

    return this.resolveNominationFiles({
      agendaEditions,
      ids: published.nominationFiles.flatMap((file) =>
        file.nominationFileId ? [file.nominationFileId] : [],
      ),
      sessionId: agenda.sessionId,
    });
  }

  private async resolveNominationFiles(query: {
    agendaEditions?: ReadonlyMap<string, { at: Date | null; by: string | null; html: string }>;
    ids: readonly string[];
    sessionId: string;
  }) {
    const { items } = await this.nominationFilesFinder.find({
      ids: query.ids,
      sessionId: query.sessionId,
    });

    return items
      .filter((file) => OfficialReportRepository.hasOutcome(file))
      .map((f) => {
        const fromAgenda = query.agendaEditions?.get(f.id);

        return {
          grade: f.magistrat.position.grade,
          htmlEdited: fromAgenda?.html ?? null,
          htmlEditedAt: fromAgenda?.at ?? null,
          htmlEditedBy: fromAgenda?.by ?? null,
          htmlFromAgenda: isDefined(fromAgenda),
          name: f.magistrat.name,
          nominationFileId: f.id,
          number: f.number,
          outcome: f.outcome.value,
          outcomeComment: f.outcome.comment,
          position: f.magistrat.position.label,
          reporters: f.reporters.map((r) => r.fullTitledName),
          targetedGrade: f.targetPosition.grade,
          targetedPosition: f.targetPosition.label,
        };
      });
  }

  private versionContent(props: {
    justiceContact: { id: bigint; name: string };
    snapshot: OfficialReportSnapshotMeta;
  }) {
    const { snapshot, justiceContact } = props;

    return {
      chairmanDisplayTitle: snapshot.chairman.displayTitle,
      chairmanFirstName: snapshot.chairman.firstName,
      chairmanGender: snapshot.chairman.gender,
      chairmanId: snapshot.chairman.id,
      chairmanLastName: snapshot.chairman.lastName,
      chairmanTitle: snapshot.chairman.title,
      hasRenunciation: snapshot.hasRenunciation,
      justiceDepartmentContactId: justiceContact.id,
      justiceDepartmentContactName: justiceContact.name,
      secretaryDisplayTitle: snapshot.secretary.displayTitle,
      secretaryFirstName: snapshot.secretary.firstName,
      secretaryGender: snapshot.secretary.gender,
      secretaryId: snapshot.secretary.id,
      secretaryLastName: snapshot.secretary.lastName,
      secretaryTitle: snapshot.secretary.title,
      sessionMeetingDate: snapshot.sessionMeeting.date.toDate(),
      sessionMeetingEndingTime: timeOnlyToDate(snapshot.sessionMeeting.end),
      sessionMeetingStartingTime: timeOnlyToDate(snapshot.sessionMeeting.start),
    };
  }

  private memberData(snapshot: {
    members: OfficialReportMembersList;
  }): Prisma.OfficialReportMemberCreateManyVersionInput[] {
    return snapshot.members.map((m) => ({
      firstName: m.firstName,
      gender: m.gender,
      isAbsent: m.isAbsent,
      lastName: m.lastName,
      memberId: m.id,
      sort: m.sort,
      title: m.displayTitle,
    }));
  }

  private async persistOfficialReportIntroEdited(message: OfficialReportIntroEdited) {
    const versionId = await this.officialReportVersionFinder.latest(message);
    await this.db.tx.officialReportVersion.update({
      where: { id: versionId },
      data: {
        introHtml: message.html,
        introOutdated: message.outdated,
      },
    });

    await this.recomputeState(versionId);
  }

  private async persistOfficialReportIntroReset(message: OfficialReportIntroReset) {
    const versionId = await this.officialReportVersionFinder.latest(message);
    await this.db.tx.officialReportVersion.update({
      where: { id: versionId },
      data: { introHtml: null, introOutdated: false },
    });

    await this.recomputeState(versionId);
  }

  private async persistOfficialReportConclusionEdited(message: OfficialReportConclusionEdited) {
    const versionId = await this.officialReportVersionFinder.latest(message);
    await this.db.tx.officialReportVersion.update({
      where: { id: versionId },
      data: {
        conclusionHtml: message.html,
        conclusionOutdated: message.outdated,
      },
    });

    await this.recomputeState(versionId);
  }

  private async persistOfficialReportConclusionReset(message: OfficialReportConclusionReset) {
    const versionId = await this.officialReportVersionFinder.latest(message);
    await this.db.tx.officialReportVersion.update({
      where: { id: versionId },
      data: { conclusionHtml: null, conclusionOutdated: false },
    });

    await this.recomputeState(versionId);
  }

  /** a block is given back to the agenda's sentence when the agenda wrote one, not to the template */
  private async persistOfficialReportFileReset(message: OfficialReportFileReset) {
    const versionId = await this.officialReportVersionFinder.latest(message);
    const proposal = await this.agendaProposalOf(message);

    await this.db.tx.officialReportNominationFile.updateMany({
      where: { nominationFileId: message.nominationFileId, versionId },
      data: {
        htmlEdited: proposal?.html ?? null,
        htmlEditedAt: proposal?.at ?? null,
        htmlEditedBy: proposal?.by ?? null,
        htmlFromAgenda: isDefined(proposal),
        htmlOutdated: false,
      },
    });

    await this.recomputeState(versionId);
  }

  private async agendaProposalOf(
    message: OfficialReportFileReset,
  ): Promise<{ at: Date | null; by: string | null; html: string } | undefined> {
    const agenda = await this.db.tx.agenda.findFirst({
      where: { officialReportId: message.officialReportId.toString() },
      select: {
        versions: {
          ...AGENDA_CONTENT_VERSIONS,
          select: {
            nominationFiles: {
              where: { htmlEdited: { not: null }, nominationFileId: message.nominationFileId },
              select: { htmlEdited: true, htmlEditedAt: true, htmlEditedBy: true },
            },
            status: true,
          },
        },
      } satisfies Prisma.AgendaSelect,
    });

    const file = agendaContentOf(agenda?.versions ?? [])?.nominationFiles[0];
    return file?.htmlEdited
      ? { at: file.htmlEditedAt, by: file.htmlEditedBy, html: file.htmlEdited }
      : undefined;
  }

  private async persistOfficialReportSectionTitleEdited(message: OfficialReportSectionTitleEdited) {
    const versionId = await this.officialReportVersionFinder.latest(message);
    await this.db.tx.officialReportSectionTitle.upsert({
      where: { primaryKey: { outcome: message.outcome, versionId } },
      create: { outcome: message.outcome, title: message.text, versionId },
      update: { title: message.text },
    });

    await this.recomputeState(versionId);
  }

  private async persistOfficialReportSectionTitleReset(message: OfficialReportSectionTitleReset) {
    const versionId = await this.officialReportVersionFinder.latest(message);
    await this.db.tx.officialReportSectionTitle.deleteMany({
      where: { outcome: message.outcome, versionId },
    });

    await this.recomputeState(versionId);
  }

  private async persistOfficialReportSectionIntroEdited(message: OfficialReportSectionIntroEdited) {
    const versionId = await this.officialReportVersionFinder.latest(message);
    await this.db.tx.officialReportSectionIntro.upsert({
      where: { primaryKey: { outcome: message.outcome, versionId } },
      create: { html: message.html, outcome: message.outcome, versionId },
      update: { html: message.html },
    });

    await this.recomputeState(versionId);
  }

  private async persistOfficialReportSectionIntroReset(message: OfficialReportSectionIntroReset) {
    const versionId = await this.officialReportVersionFinder.latest(message);
    await this.db.tx.officialReportSectionIntro.deleteMany({
      where: { outcome: message.outcome, versionId },
    });

    await this.recomputeState(versionId);
  }

  private async persistOfficialReportValidated(message: OfficialReportValidated) {
    const versions = await this.db.tx.officialReportVersion.findMany({
      where: { officialReportId: message.officialReportId },
      select: {
        id: true,
        pdf: { select: { id: true, path: true } },
        status: true,
      } satisfies Prisma.OfficialReportVersionSelect,
      orderBy: { version: 'desc' },
    });

    const [draft, ...superseded] = versions;
    if (!draft || draft.status === 'VALIDATED') throw new NotFoundException();

    await this.db.tx.officialReportVersion.update({
      where: { id: draft.id },
      data: { status: 'VALIDATED', validatedAt: message.validatedAt, validatedBy: message.validatedBy },
    });

    // the business asked for no history: validating drops the version it replaces
    await this.discardVersions(superseded);
  }

  private async persistOfficialReportDraftUpdatedBySystem(message: OfficialReportDraftUpdatedBySystem) {
    const at = this.clock.now();
    const versionId = await this.officialReportVersionFinder.latest(message);

    await this.db.tx.officialReportVersion.update({
      where: { id: versionId },
      data: { systemUpdatedAt: at },
    });
    await this.db.tx.officialReportVersionSystemUpdate.upsert({
      where: { primaryKey: { cause: message.cause, versionId } },
      create: { at, cause: message.cause, versionId },
      update: { at },
    });
  }

  private async persistOfficialReportUpdateSkipped(message: OfficialReportUpdateSkipped) {
    const at = this.clock.now();
    const versionId = await this.officialReportVersionFinder.latest(message);

    await this.db.tx.officialReportVersionSkippedUpdate.upsert({
      where: { primaryKey: { cause: message.cause, versionId } },
      create: { at, cause: message.cause, versionId },
      update: { at },
    });
  }

  private async persistOfficialReportDraftEdited(message: OfficialReportDraftEdited) {
    await this.db.tx.officialReportVersion.updateMany({
      where: { officialReportId: message.officialReportId, status: 'DRAFT' },
      data: { updatedAt: this.clock.now(), updatedBy: message.authorId },
    });
  }

  private async persistOfficialReportDraftOpened(message: OfficialReportDraftOpened) {
    const validated = await this.db.tx.officialReportVersion.findFirst({
      where: { officialReportId: message.officialReportId, status: 'VALIDATED' },
      include: {
        members: { omit: { id: true, versionId: true } },
        nominationFiles: { omit: { createdAt: true, id: true, updatedAt: true, versionId: true } },
        sectionIntros: { omit: { createdAt: true, updatedAt: true, versionId: true } },
        sectionTitles: { omit: { versionId: true } },
      } satisfies Prisma.OfficialReportVersionInclude,
      omit: {
        createdAt: true,
        createdBy: true,
        id: true,
        status: true,
        systemUpdatedAt: true,
        updatedAt: true,
        updatedBy: true,
        validatedAt: true,
        validatedBy: true,
      },
      orderBy: { version: 'desc' },
    });

    if (!validated) throw new NotFoundException();
    const { members, nominationFiles, sectionTitles, sectionIntros, version, ...content } = validated;

    // the draft starts as an exact copy: html and pdf stay empty until it is rendered again
    await this.db.tx.officialReportVersion.create({
      data: {
        ...content,
        createdBy: message.authorId,
        html: null,
        id: makeId('OfficialReportVersionId'),
        members: { createMany: { data: members } },
        nominationFiles: {
          createMany: { data: nominationFiles.map((file) => ({ ...file, reporters: [...file.reporters] })) },
        },
        pdfId: null,
        sectionIntros: { createMany: { data: sectionIntros } },
        sectionTitles: { createMany: { data: sectionTitles } },
        status: 'DRAFT',
        version: version + 1,
      },
    });
  }

  private async persistOfficialReportDraftDiscarded(message: OfficialReportDraftDiscarded) {
    const drafts = await this.db.tx.officialReportVersion.findMany({
      where: { officialReportId: message.officialReportId, status: 'DRAFT' },
      select: {
        id: true,
        pdf: { select: { id: true, path: true } },
      } satisfies Prisma.OfficialReportVersionSelect,
    });

    await this.discardVersions(drafts);
  }

  private async discardVersions(
    versions: readonly { id: string; pdf: { id: string; path: readonly string[] } | null }[],
  ): Promise<void> {
    if (versions.length === 0) return;

    await this.db.tx.officialReportVersion.deleteMany({
      where: { id: { in: versions.map(({ id }) => id) } },
    });

    const pdfs = versions.flatMap(({ pdf }) => (pdf ? [pdf] : []));
    if (pdfs.length === 0) return;

    this.files.delete(pdfs);
  }

  private async recomputeState(versionId: string): Promise<void> {
    await this.recomputeOutdated(versionId);
    await this.recomputeManuallyEdited(versionId);
    await this.resetDocumentData(versionId);
  }

  /**
   * a rewritten part makes the stored document stale, so it is dropped and rendered again on the
   * next read. The validation is left alone: editing a validated report forks a draft instead.
   */
  private async resetDocumentData(versionId: string): Promise<void> {
    const version = await this.db.tx.officialReportVersion.findUnique({
      where: { id: versionId },
      select: { pdf: { select: { id: true, path: true } } } satisfies Prisma.OfficialReportVersionSelect,
    });
    await this.db.tx.officialReportVersion.update({
      where: { id: versionId },
      data: { html: null, pdfId: null },
    });

    if (!version?.pdf) return;
    this.files.delete([version.pdf]);
  }

  private async recomputeManuallyEdited(versionId: string): Promise<void> {
    const manuallyEditedOfficialReport = await this.db.tx.officialReportVersion.findFirst({
      where: {
        id: versionId,
        OR: [
          { introHtml: { not: null } },
          { conclusionHtml: { not: null } },
          { nominationFiles: { some: { htmlEdited: { not: null } } } },
          { sectionIntros: { some: {} } },
          { sectionTitles: { some: { title: { not: null } } } },
        ],
      },
      select: { id: true } satisfies Prisma.OfficialReportVersionSelect,
    });

    await this.db.tx.officialReportVersion.update({
      where: { id: versionId },
      data: { isManuallyEdited: isDefined(manuallyEditedOfficialReport) },
    });
  }

  private async recomputeOutdated(versionId: string): Promise<void> {
    const outdatedOfficialReport = await this.db.tx.officialReportVersion.findFirst({
      where: {
        id: versionId,
        OR: [
          { introOutdated: true },
          { conclusionOutdated: true },
          { nominationFiles: { some: { htmlOutdated: true } } },
        ],
      },
      select: { id: true } satisfies Prisma.OfficialReportVersionSelect,
    });

    await this.db.tx.officialReportVersion.update({
      where: { id: versionId },
      data: { outdated: isDefined(outdatedOfficialReport) },
    });
  }

  private async persistOfficialReportDeleted(message: OfficialReportDeleted) {
    await this.db.tx.agenda.updateMany({
      where: { officialReportId: message.officialReportId },
      data: { officialReportId: null },
    });

    // the versions cascade away with the report, their stored files do not
    const versions = await this.db.tx.officialReportVersion.findMany({
      where: { officialReportId: message.officialReportId, pdfId: { not: null } },
      select: { pdf: { select: { id: true, path: true } } } satisfies Prisma.OfficialReportVersionSelect,
    });

    await this.db.tx.officialReport.delete({
      where: { id: message.officialReportId },
    });

    const pdfs = versions.flatMap(({ pdf }) => (pdf ? [pdf] : []));
    if (pdfs.length === 0) return;

    this.files.delete(pdfs);
  }

  private static hasOutcome<
    T extends { outcome: { comment: string | null; value: DocNominationFileOutcomeEnum } | null },
  >(file: T): file is T & { outcome: NonNullable<T['outcome']> } {
    return isDefined(file.outcome);
  }
}
