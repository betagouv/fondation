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
  OfficialReportDocumentReset,
  OfficialReportFileEdited,
  OfficialReportFileReset,
  OfficialReportIntroEdited,
  OfficialReportIntroReset,
  OfficialReportDraftDiscarded,
  OfficialReportDraftOpened,
  OfficialReportInvalidated,
  OfficialReportSectionIntroEdited,
  OfficialReportSectionIntroReset,
  OfficialReportSectionTitleEdited,
  OfficialReportSectionTitleReset,
  OfficialReportUpdated,
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
  async find(query: { id: string }): Promise<OfficialReport> {
    const versionId = await this.officialReportVersionFinder.latest({ officialReportId: query.id });
    const version = await this.db.tx.officialReportVersion.findUnique({
      where: { id: versionId },
      select: {
        hasRenunciation: true,
        justiceDepartmentContactId: true,
        sessionMeetingDate: true,
        sessionMeetingStartingTime: true,
        sessionMeetingEndingTime: true,

        introHtml: true,
        conclusionHtml: true,

        pdfId: true,
        validatedAt: true,

        officialReport: {
          select: {
            id: true,
            agendas: {
              select: {
                id: true,
                formation: true,
                officialReportId: true,
                sessionId: true,
                versions: {
                  take: 2,
                  orderBy: { version: 'desc' },
                  select: { date: true, status: true },
                },
              },
              take: 1,
            },
          },
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

    if (!version) throw new NotFoundException();
    const officialReport = { ...version, ...version.officialReport };

    const officialReportId = makeId('OfficialReportId', officialReport.id);
    const rawAgenda = assertIsDefined(
      officialReport.agendas[0],
      `Official Report "${query.id}" has no agenda`,
    );
    // the report speaks of the agenda as it was validated, and of its draft only while the agenda
    // has never been validated, which is the one case where nothing else exists to speak of
    const agendaDate = assertIsDefined(
      agendaContentOf(rawAgenda.versions)?.date,
      `Official Report "${query.id}" has no agenda version`,
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
        date: DateOnly.fromUtcDate(agendaDate),
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
      isDocumentStored: isDefined(officialReport.pdfId),
      validatedAt: officialReport.validatedAt,
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
        where: { versionId: await this.officialReportVersionFinder.latest({ officialReportId: query.id }) },
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
      } else if (message instanceof OfficialReportValidated) {
        await this.persistOfficialReportValidated(message);
      } else if (message instanceof OfficialReportInvalidated) {
        await this.persistOfficialReportInvalidated(message);
      } else if (message instanceof OfficialReportDraftOpened) {
        await this.persistOfficialReportDraftOpened(message);
      } else if (message instanceof OfficialReportDraftDiscarded) {
        await this.persistOfficialReportDraftDiscarded(message);
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
        id: message.id,
        authorId: message.authorId,
        agendas: { connect: { id: message.snapshot.meta.agenda.id } },
        versions: {
          create: {
            ...this.versionContent({ justiceContact, snapshot: message.snapshot.meta }),
            version: 1,
            id: makeId('OfficialReportVersionId'),
            createdBy: message.authorId,
            members: { createMany: { data: this.memberData(message.snapshot.meta) } },
            nominationFiles: { createMany: { data: nominationFiles } },
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
  }

  private async persistOfficialReportInvalidated(message: OfficialReportInvalidated) {
    const filesToCreate = message.diff.files
      .filter((file) => file.action === 'create')
      .map((file) => file.nominationFileId);

    if (filesToCreate.length > 0) {
      const self = await this.db.tx.officialReport.findUniqueOrThrow({
        where: { id: message.officialReportId },
        select: {
          agendas: {
            select: {
              sessionId: true,
              versions: {
                ...AGENDA_CONTENT_VERSIONS,
                select: {
                  status: true,
                  nominationFiles: {
                    select: { nominationFileId: true, htmlEdited: true, htmlEditedAt: true },
                    where: { nominationFileId: { in: filesToCreate }, htmlEdited: { not: null } },
                  },
                },
              },
            },
          },
        },
      });
      const rawAgenda = assertIsDefined(self.agendas[0]);
      const { sessionId } = rawAgenda;
      const versionId = await this.officialReportVersionFinder.latest(message);
      const files = await this.resolveNominationFiles({
        sessionId,
        ids: filesToCreate,
        // a file joining the report late takes the agenda block as it stands, like the others did
        agendaEditions: new Map(
          agendaContentOf(rawAgenda.versions)?.nominationFiles.flatMap((file) =>
            file.nominationFileId && file.htmlEdited
              ? [[file.nominationFileId, { html: file.htmlEdited, at: file.htmlEditedAt }] as const]
              : [],
          ) ?? [],
        ),
      });

      await this.db.tx.officialReportNominationFile.createMany({
        data: files.map((file) => ({ ...file, versionId })),
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

    const filesToDelete = message.diff.files
      .filter((file) => file.action === 'delete')
      .map((file) => file.nominationFileId);

    const editedVersionId = await this.officialReportVersionFinder.latest(message);

    if (filesToDelete.length > 0) {
      await this.db.tx.officialReportNominationFile.deleteMany({
        where: { versionId: editedVersionId, nominationFileId: { in: filesToDelete } },
      });
    }

    await this.db.tx.officialReportVersion.update({
      where: { id: editedVersionId },
      data: {
        introOutdated: message.diff.intro === 'OUTDATED' ? true : undefined,
        conclusionOutdated: message.diff.conclusion === 'OUTDATED' ? true : undefined,
      },
    });

    if (message.diff.hasAny) await this.recomputeState(editedVersionId);
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
            status: true,
            nominationFiles: {
              select: { nominationFileId: true, htmlEdited: true, htmlEditedAt: true },
              where: { nominationFileId: { not: null } },
            },
          },
        },
      },
    });

    if (!agenda) return [];

    const published = agendaContentOf(agenda.versions);
    if (!published) return [];

    // the two documents write the very same sentence for a file, so a block the agenda carries by
    // hand is taken as is. From then on the report owns its copy: later agenda editions leave it be.
    const agendaEditions = new Map(
      published.nominationFiles.flatMap((file) =>
        file.nominationFileId && file.htmlEdited
          ? [[file.nominationFileId, { html: file.htmlEdited, at: file.htmlEditedAt }] as const]
          : [],
      ),
    );

    return this.resolveNominationFiles({
      agendaEditions,
      sessionId: agenda.sessionId,
      ids: published.nominationFiles.flatMap((file) =>
        file.nominationFileId ? [file.nominationFileId] : [],
      ),
    });
  }

  private async resolveNominationFiles(query: {
    agendaEditions?: ReadonlyMap<string, { html: string; at: Date | null }>;
    sessionId: string;
    ids: readonly string[];
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
          htmlEdited: fromAgenda?.html ?? null,
          htmlEditedAt: fromAgenda?.at ?? null,
          htmlFromAgenda: isDefined(fromAgenda),
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
        };
      });
  }

  private versionContent(props: {
    snapshot: OfficialReportSnapshotMeta;
    justiceContact: { id: bigint; name: string };
  }) {
    const { snapshot, justiceContact } = props;

    return {
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
    };
  }

  private memberData(snapshot: {
    members: OfficialReportMembersList;
  }): Prisma.OfficialReportMemberCreateManyVersionInput[] {
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
    await this.recomputeState(await this.officialReportVersionFinder.latest(message));
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
      data: { introHtml: null, introOutdated: false, html: null, pdfId: null },
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
      data: { conclusionHtml: null, conclusionOutdated: false, html: null, pdfId: null },
    });

    await this.recomputeState(versionId);
  }

  private async persistOfficialReportFileEdited(message: OfficialReportFileEdited) {
    const versionId = await this.officialReportVersionFinder.latest(message);
    await this.db.tx.officialReportNominationFile.updateMany({
      where: { versionId, nominationFileId: message.nominationFileId },
      data: {
        htmlEdited: message.html,
        htmlOutdated: message.outdated,
        htmlEditedAt: this.clock.now(),
        htmlFromAgenda: false,
      },
    });

    await this.recomputeState(versionId);
  }

  /** a block is given back to the agenda's sentence when the agenda wrote one, not to the template */
  private async persistOfficialReportFileReset(message: OfficialReportFileReset) {
    const versionId = await this.officialReportVersionFinder.latest(message);
    const proposal = await this.agendaProposalOf(message);

    await this.db.tx.officialReportNominationFile.updateMany({
      where: { versionId, nominationFileId: message.nominationFileId },
      data: {
        htmlEdited: proposal?.html ?? null,
        htmlOutdated: false,
        htmlEditedAt: proposal?.at ?? null,
        htmlFromAgenda: isDefined(proposal),
      },
    });

    await this.recomputeState(versionId);
  }

  private async agendaProposalOf(
    message: OfficialReportFileReset,
  ): Promise<{ at: Date | null; html: string } | undefined> {
    const agenda = await this.db.tx.agenda.findFirst({
      where: { officialReportId: message.officialReportId.toString() },
      select: {
        versions: {
          ...AGENDA_CONTENT_VERSIONS,
          select: {
            status: true,
            nominationFiles: {
              select: { htmlEdited: true, htmlEditedAt: true },
              where: { nominationFileId: message.nominationFileId, htmlEdited: { not: null } },
            },
          },
        },
      },
    });

    const file = agendaContentOf(agenda?.versions ?? [])?.nominationFiles[0];
    return file?.htmlEdited ? { at: file.htmlEditedAt, html: file.htmlEdited } : undefined;
  }

  private async persistOfficialReportSectionTitleEdited(message: OfficialReportSectionTitleEdited) {
    const versionId = await this.officialReportVersionFinder.latest(message);
    await this.db.tx.officialReportSectionTitle.upsert({
      where: { primaryKey: { versionId, outcome: message.outcome } },
      create: { versionId, outcome: message.outcome, title: message.text },
      update: { title: message.text },
    });

    await this.recomputeState(versionId);
  }

  private async persistOfficialReportSectionTitleReset(message: OfficialReportSectionTitleReset) {
    const versionId = await this.officialReportVersionFinder.latest(message);
    await this.db.tx.officialReportSectionTitle.deleteMany({
      where: { versionId, outcome: message.outcome },
    });

    await this.recomputeState(versionId);
  }

  private async persistOfficialReportSectionIntroEdited(message: OfficialReportSectionIntroEdited) {
    const versionId = await this.officialReportVersionFinder.latest(message);
    await this.db.tx.officialReportSectionIntro.upsert({
      where: { primaryKey: { versionId, outcome: message.outcome } },
      create: { versionId, outcome: message.outcome, html: message.html },
      update: { html: message.html },
    });

    await this.recomputeState(versionId);
  }

  private async persistOfficialReportSectionIntroReset(message: OfficialReportSectionIntroReset) {
    const versionId = await this.officialReportVersionFinder.latest(message);
    await this.db.tx.officialReportSectionIntro.deleteMany({
      where: { versionId, outcome: message.outcome },
    });

    await this.recomputeState(versionId);
  }

  private async persistOfficialReportValidated(message: OfficialReportValidated) {
    const versions = await this.db.tx.officialReportVersion.findMany({
      where: { officialReportId: message.officialReportId },
      orderBy: { version: 'desc' },
      select: { id: true, status: true, pdf: { select: { id: true, path: true } } },
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

  private async persistOfficialReportDraftOpened(message: OfficialReportDraftOpened) {
    const validated = await this.db.tx.officialReportVersion.findFirst({
      where: { officialReportId: message.officialReportId, status: 'VALIDATED' },
      orderBy: { version: 'desc' },
      omit: { id: true, createdAt: true, validatedAt: true, validatedBy: true, status: true },
      include: {
        members: { omit: { id: true, versionId: true } },
        nominationFiles: { omit: { id: true, versionId: true, createdAt: true, updatedAt: true } },
        sectionTitles: { omit: { versionId: true } },
        sectionIntros: { omit: { versionId: true, createdAt: true, updatedAt: true } },
      },
    });

    if (!validated) throw new NotFoundException();
    const { members, nominationFiles, sectionTitles, sectionIntros, version, ...content } = validated;

    // the draft starts as an exact copy: html and pdf stay empty until it is rendered again
    await this.db.tx.officialReportVersion.create({
      data: {
        ...content,
        version: version + 1,
        status: 'DRAFT',
        id: makeId('OfficialReportVersionId'),
        html: null,
        pdfId: null,
        members: { createMany: { data: members } },
        nominationFiles: {
          createMany: { data: nominationFiles.map((file) => ({ ...file, reporters: [...file.reporters] })) },
        },
        sectionTitles: { createMany: { data: sectionTitles } },
        sectionIntros: { createMany: { data: sectionIntros } },
      },
    });
  }

  private async persistOfficialReportDraftDiscarded(message: OfficialReportDraftDiscarded) {
    const drafts = await this.db.tx.officialReportVersion.findMany({
      where: { officialReportId: message.officialReportId, status: 'DRAFT' },
      select: { id: true, pdf: { select: { id: true, path: true } } },
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

    await this.db.tx.file.deleteMany({ where: { id: { in: pdfs.map(({ id }) => id) } } });
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
      select: { pdf: { select: { id: true, path: true } } },
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
      select: { id: true },
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
    });

    await this.db.tx.officialReportVersion.update({
      where: { id: versionId },
      data: { isManuallyEdited: isDefined(manuallyEditedOfficialReport) },
    });
  }

  private async recomputeOutdated(versionId: string): Promise<void> {
    const outdatedOfficialReport = await this.db.tx.officialReportVersion.findFirst({
      select: { id: true },
      where: {
        id: versionId,
        OR: [
          { introOutdated: true },
          { conclusionOutdated: true },
          { nominationFiles: { some: { htmlOutdated: true } } },
        ],
      },
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
      select: { pdf: { select: { id: true, path: true } } },
    });

    await this.db.tx.officialReport.delete({
      where: { id: message.officialReportId },
    });

    const pdfs = versions.flatMap(({ pdf }) => (pdf ? [pdf] : []));
    if (pdfs.length === 0) return;

    await this.db.tx.file.deleteMany({ where: { id: { in: pdfs.map(({ id }) => id) } } });
    this.files.delete(pdfs);
  }

  private static hasOutcome<
    T extends { outcome: { value: DocNominationFileOutcomeEnum; comment: string | null } | null },
  >(file: T): file is T & { outcome: NonNullable<T['outcome']> } {
    return isDefined(file.outcome);
  }
}
