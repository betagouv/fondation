import { Propagation, Transactional } from '@nestjs-cls/transactional';
import {
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import {
  Agenda,
  AgendaCreated,
  AgendaDeleted,
  AgendaDraftDiscarded,
  AgendaDraftOpened,
  AgendaValidated,
  AgendaFileBlockEdited,
  AgendaFileBlockReset,
  AgendaFilesReportersUpdated,
  AgendaFilesUpdated,
  AgendaMetadataUpdated,
} from '../../domain/agenda';
import { AgendaSnapshot } from '../../domain/agenda-snapshot';
import { AgendaVersionFinder } from '../finders/agenda-version.finder';
import { Prisma } from 'src/generated/prisma/client';
import { DocsNominationFilesFinder } from 'src/modules/docs/shared/infrastructure/finders/docs-nomination-files.finder';
import { Clock } from 'src/modules/framework/clock';
import { Db } from 'src/modules/framework/database';
import { Files } from 'src/modules/framework/files';
import { MembersService } from 'src/modules/members';
import { assertNever } from 'src/utils/assert-never';
import { DateOnly } from 'src/utils/date-only';
import { makeId } from 'src/utils/id';
import { isDefined } from 'src/utils/is-defined';

@Injectable()
export class AgendaRepository {
  constructor(
    private readonly db: Db,
    private readonly clock: Clock,
    private readonly files: Files,
    private readonly docsNominationFilesFinder: DocsNominationFilesFinder,
    private readonly agendaVersionFinder: AgendaVersionFinder,

    @Inject(forwardRef(() => MembersService))
    private readonly members: MembersService,
  ) {}

  @Transactional(Propagation.Mandatory)
  async persist(agenda: Agenda): Promise<void> {
    for (const message of agenda.messages) {
      if (message instanceof AgendaCreated) {
        await this.persistAgendaCreated(message);
      } else if (message instanceof AgendaMetadataUpdated) {
        await this.persistAgendaMetadataUpdated(message);
      } else if (message instanceof AgendaFilesUpdated) {
        await this.persistAgendaFilesUpdated(message);
      } else if (message instanceof AgendaDeleted) {
        await this.persistAgendaDeleted(message);
      } else if (message instanceof AgendaDraftOpened) {
        await this.persistAgendaDraftOpened(message);
      } else if (message instanceof AgendaValidated) {
        await this.persistAgendaValidated(message);
      } else if (message instanceof AgendaDraftDiscarded) {
        await this.persistAgendaDraftDiscarded(message);
      } else if (message instanceof AgendaFileBlockEdited) {
        await this.persistAgendaFileBlockEdited(message);
      } else if (message instanceof AgendaFileBlockReset) {
        await this.persistAgendaFileBlockReset(message);
      } else if (message instanceof AgendaFilesReportersUpdated) {
        await this.persistAgendaFilesReportersUpdated(message);
      } else {
        assertNever(message);
      }
    }
  }

  @Transactional()
  async find(query: { actorId?: string | null; agendaId: string }): Promise<Agenda> {
    const versionId = await this.agendaVersionFinder.latest({ agendaId: query.agendaId });

    const foundVersion = await this.db.tx.agendaVersion.findUnique({
      select: {
        date: true,
        status: true,
        pdfFileId: true,
        sessionMeetingDate: true,
        chairmanId: true,
        agenda: { select: { id: true, sessionId: true, officialReportId: true } },
        nominationFiles: {
          where: { nominationFileId: { not: null } },
          select: { id: true, nominationFileId: true, reporters: true, htmlEdited: true },
        },
      } satisfies Prisma.AgendaVersionSelect,
      where: { id: versionId },
    });

    if (!foundVersion) throw new NotFoundException();
    const foundAgenda = foundVersion.agenda;

    const snapshot = AgendaSnapshot.from({
      agendaId: makeId('AgendaId', foundAgenda.id),
      chairmanId: foundVersion.chairmanId,
      date: DateOnly.fromUtcDate(foundVersion.date),
      sessionMeetingDate: DateOnly.fromUtcDate(foundVersion.sessionMeetingDate),
      nominationFiles: foundVersion.nominationFiles.flatMap((f) =>
        f.nominationFileId
          ? [
              {
                id: f.id,
                nominationFileId: f.nominationFileId,
                reporters: f.reporters,
                isManuallyEdited: isDefined(f.htmlEdited),
              },
            ]
          : [],
      ),
    });

    return Agenda.from({
      snapshot,
      actorId: query.actorId ?? null,
      isDocumentStored: isDefined(foundVersion.pdfFileId),
      isValidated: foundVersion.status === 'VALIDATED',
      id: makeId('AgendaId', foundAgenda.id),
      sessionId: makeId('SessionId', foundAgenda.sessionId),
      officialReportId: foundAgenda.officialReportId
        ? makeId('OfficialReportId', foundAgenda.officialReportId)
        : null,
    });
  }

  private async persistAgendaCreated(message: AgendaCreated) {
    const session = await this.db.tx.session.findUnique({
      where: { id: message.sessionId, deletedAt: null },
      select: { formation: true, name: true } satisfies Prisma.SessionSelect,
    });

    if (!session) throw new InternalServerErrorException();
    const { formation, name } = session;

    return this.db.tx.agenda.create({
      data: {
        formation,
        sessionName: name.trim(),
        id: message.agendaId,
        createdBy: message.authorId,
        sessionId: message.sessionId,
        versions: {
          create: {
            version: 1,
            id: makeId('AgendaVersionId'),
            chairmanFirstName: message.chairman.firstName,
            chairmanLastName: message.chairman.lastName,
            chairmanGender: message.chairman.gender,
            date: message.date,
            sessionMeetingDate: message.sessionMeetingDate,
            createdBy: message.authorId,
            chairmanId: message.chairman.id,
            chairmanTitle: message.chairman.title,
            chairmanDisplayTitle: message.chairman.displayTitle,
            nominationFiles: {
              createMany: {
                data: message.nominationFiles.map((file) => ({
                  grade: file.grade,
                  name: file.name,
                  position: file.currentPosition,
                  number: file.number,
                  targetedGrade: file.targetedGrade,
                  targetedPosition: file.targetedPosition,
                  nominationFileId: file.id,
                  outcome: file.outcome?.value,
                  outcomeComment: file.outcome?.comment,
                  reporters: file.reporters as string[],
                })),
              },
            },
          },
        },
      },
    });
  }

  private async persistAgendaMetadataUpdated(message: AgendaMetadataUpdated): Promise<void> {
    const chairman = await this.members.internalGetMember({ id: message.update.chairmanId });
    const versionId = await this.agendaVersionFinder.latest({ agendaId: message.agendaId });

    await this.db.tx.agendaVersion.update({
      where: { id: versionId },
      data: {
        createdBy: message.authorId,

        date: message.update.date.toDate(),
        sessionMeetingDate: message.update.sessionMeetingDate.toDate(),

        chairmanId: chairman.id,
        chairmanFirstName: chairman.firstName,
        chairmanLastName: chairman.lastName,
        chairmanGender: chairman.gender,
        chairmanTitle: chairman.title,
        chairmanDisplayTitle: chairman.displayTitle,
      },
    });

    await this.invalidateAgendaDocument(versionId);
  }

  private async persistAgendaFilesUpdated(message: AgendaFilesUpdated): Promise<void> {
    const versionId = await this.agendaVersionFinder.latest({ agendaId: message.agendaId });

    if (message.update.removed.length > 0) {
      await this.db.tx.agendaNominationFile.deleteMany({
        where: {
          versionId,
          nominationFileId: { in: message.update.removed as string[] },
        },
      });
    }

    if (message.update.added.length > 0) {
      const { items: files } = await this.docsNominationFilesFinder.find({
        ids: message.update.added,
        sessionId: message.sessionId,
      });

      await this.db.tx.agendaNominationFile.createMany({
        data: files.map((file) => ({
          versionId,
          grade: file.magistrat.position.grade,
          name: file.magistrat.name,
          position: file.magistrat.position.label,
          number: file.number,
          targetedGrade: file.targetPosition.grade,
          targetedPosition: file.targetPosition.label,
          nominationFileId: file.id,
          outcome: file.outcome?.value,
          outcomeComment: file.outcome?.comment,
          reporters: file.reporters.map((r) => r.fullTitledName),
        })),
      });
    }

    await this.recomputeAgendaState(versionId);
  }

  private async invalidateAgendaDocument(versionId: string): Promise<void> {
    const version = await this.db.tx.agendaVersion.findUnique({
      where: { id: versionId },
      select: { pdf: { select: { id: true, path: true } } } satisfies Prisma.AgendaVersionSelect,
    });

    await this.db.tx.agendaVersion.update({
      where: { id: versionId },
      data: { html: null, pdfFileId: null },
    });

    if (version?.pdf) this.files.delete([version.pdf]);
  }

  private async persistAgendaDeleted(message: AgendaDeleted) {
    const found = await this.db.tx.agenda.findUnique({
      where: { id: message.agendaId },
      select: {
        officialReportId: true,
        versions: {
          select: { pdf: { select: { id: true, path: true } } },
          where: { pdfFileId: { not: null } },
        },
        officialReport: {
          select: {
            versions: {
              select: { pdf: { select: { id: true, path: true } } },
              where: { pdfId: { not: null } },
            },
          },
        },
        justicePresentationPlans: {
          select: { planId: true, plan: { select: { pdf: { select: { id: true, path: true } } } } },
        },
      } satisfies Prisma.AgendaSelect,
    });
    if (!found) return;

    if (found.officialReportId)
      await this.db.tx.officialReport.delete({ where: { id: found.officialReportId } });
    // every notice the agenda belongs to goes with it, the other agendas it held included
    const planIds = found.justicePresentationPlans.map(({ planId }) => planId);
    await this.db.tx.justicePresentationPlanToAgenda.deleteMany({ where: { planId: { in: planIds } } });
    await this.db.tx.justicePresentationPlan.deleteMany({ where: { id: { in: planIds } } });

    await this.db.tx.agenda.delete({ where: { id: message.agendaId } });

    const pdfs = [
      ...found.versions,
      ...(found.officialReport?.versions ?? []),
      ...found.justicePresentationPlans.map(({ plan }) => plan),
    ].flatMap(({ pdf }) => (pdf ? [pdf] : []));

    if (pdfs.length > 0) this.files.delete(pdfs);
  }

  private async persistAgendaDraftOpened(message: AgendaDraftOpened) {
    const validated = await this.db.tx.agendaVersion.findFirst({
      where: { agendaId: message.agendaId, status: 'VALIDATED' },
      orderBy: { version: 'desc' },
      select: {
        version: true,
        date: true,
        sessionMeetingDate: true,
        chairmanId: true,
        chairmanFirstName: true,
        chairmanLastName: true,
        chairmanTitle: true,
        chairmanDisplayTitle: true,
        chairmanGender: true,
        outdated: true,
        isManuallyEdited: true,
        nominationFiles: {
          select: {
            nominationFileId: true,
            number: true,
            name: true,
            grade: true,
            position: true,
            targetedPosition: true,
            targetedGrade: true,
            outcome: true,
            outcomeComment: true,
            reporters: true,
            htmlEdited: true,
            htmlEditedAt: true,
            htmlOutdated: true,
          },
        },
      } satisfies Prisma.AgendaVersionSelect,
    });

    if (!validated) throw new NotFoundException();
    const { nominationFiles, version, ...content } = validated;

    // the draft starts as an exact copy: html and pdf stay empty until it is rendered again
    await this.db.tx.agendaVersion.create({
      data: {
        ...content,
        createdBy: message.authorId,
        version: version + 1,
        status: 'DRAFT',
        id: makeId('AgendaVersionId'),
        agendaId: message.agendaId,
        nominationFiles: {
          createMany: { data: nominationFiles.map((file) => ({ ...file, reporters: [...file.reporters] })) },
        },
      },
    });
  }

  private async persistAgendaValidated(message: AgendaValidated) {
    const versions = await this.db.tx.agendaVersion.findMany({
      where: { agendaId: message.agendaId },
      orderBy: { version: 'desc' },
      select: {
        id: true,
        status: true,
        pdf: { select: { id: true, path: true } },
      } satisfies Prisma.AgendaVersionSelect,
    });

    const [draft, ...superseded] = versions;
    if (!draft || draft.status === 'VALIDATED') throw new NotFoundException();

    await this.db.tx.agendaVersion.update({
      where: { id: draft.id },
      data: {
        status: 'VALIDATED',
        validatedAt: message.validatedAt,
        validatedBy: message.validatedBy,
      },
    });

    // the business asked for no history: validating drops the version it replaces
    await this.discardVersions(superseded);
  }

  private async persistAgendaDraftDiscarded(message: AgendaDraftDiscarded) {
    const draft = await this.db.tx.agendaVersion.findFirst({
      where: { agendaId: message.agendaId, status: 'DRAFT' },
      orderBy: { version: 'desc' },
      select: { id: true, pdf: { select: { id: true, path: true } } } satisfies Prisma.AgendaVersionSelect,
    });

    if (!draft) throw new NotFoundException();

    await this.discardVersions([draft]);
  }

  private async discardVersions(
    versions: readonly { id: string; pdf: { id: string; path: readonly string[] } | null }[],
  ): Promise<void> {
    if (versions.length === 0) return;

    await this.db.tx.agendaVersion.deleteMany({ where: { id: { in: versions.map(({ id }) => id) } } });

    const pdfs = versions.flatMap(({ pdf }) => (pdf ? [pdf] : []));
    if (pdfs.length > 0) {
      this.files.delete(pdfs);
    }
  }

  private async persistAgendaFileBlockEdited(message: AgendaFileBlockEdited) {
    const versionId = await this.agendaVersionFinder.latest({ agendaId: message.agendaId });

    await this.db.tx.agendaNominationFile.updateMany({
      where: { nominationFileId: message.nominationFileId, versionId },
      data: {
        htmlEdited: message.html,
        htmlOutdated: message.outdated,
        htmlEditedAt: this.clock.now(),
        htmlEditedBy: message.authorId,
      },
    });

    await this.recomputeAgendaState(versionId);
  }

  private async persistAgendaFileBlockReset(message: AgendaFileBlockReset) {
    const versionId = await this.agendaVersionFinder.latest({ agendaId: message.agendaId });

    await this.db.tx.agendaNominationFile.updateMany({
      where: { nominationFileId: message.nominationFileId, versionId },
      data: { htmlEdited: null, htmlOutdated: false, htmlEditedAt: null, htmlEditedBy: null },
    });

    await this.recomputeAgendaState(versionId);
  }

  private async persistAgendaFilesReportersUpdated(message: AgendaFilesReportersUpdated): Promise<void> {
    const versionId = await this.agendaVersionFinder.latest({ agendaId: message.agendaId });

    for (const nf of message.files) {
      await this.db.tx.agendaNominationFile.updateMany({
        where: { nominationFileId: nf.nominationFileId, versionId },
        data: { reporters: [...nf.reporters], htmlOutdated: nf.isOutdated },
      });
    }

    await this.recomputeAgendaState(versionId);
  }

  private async recomputeAgendaState(versionId: string): Promise<void> {
    const manuallyEdited = await this.db.tx.agendaVersion.findFirst({
      select: { id: true } satisfies Prisma.AgendaVersionSelect,
      where: { id: versionId, nominationFiles: { some: { htmlEdited: { not: null } } } },
    });

    const outdated = await this.db.tx.agendaVersion.findFirst({
      select: { id: true } satisfies Prisma.AgendaVersionSelect,
      where: { id: versionId, nominationFiles: { some: { htmlOutdated: true } } },
    });

    await this.db.tx.agendaVersion.update({
      where: { id: versionId },
      data: { isManuallyEdited: isDefined(manuallyEdited), outdated: isDefined(outdated) },
    });

    await this.invalidateAgendaDocument(versionId);
  }
}
