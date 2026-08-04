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
  AgendaFileBlockEdited,
  AgendaFileBlockReset,
  AgendaFilesUpdated,
  AgendaMetadataUpdated,
} from '../../domain/agenda';
import { AgendaSnapshot } from '../../domain/agenda-snapshot';
import { DocsNominationFilesFinder } from 'src/modules/docs/shared/infrastructure/finders/docs-nomination-files.finder';
import { Db } from 'src/modules/framework/database';
import { MembersService } from 'src/modules/members';
import { assertNever } from 'src/utils/assert-never';
import { DateOnly } from 'src/utils/date-only';
import { makeId } from 'src/utils/id';
import { isDefined } from 'src/utils/is-defined';

@Injectable()
export class AgendaRepository {
  constructor(
    private readonly db: Db,
    private readonly docsNominationFilesFinder: DocsNominationFilesFinder,

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
      } else if (message instanceof AgendaFileBlockEdited) {
        await this.persistAgendaFileBlockEdited(message);
      } else if (message instanceof AgendaFileBlockReset) {
        await this.persistAgendaFileBlockReset(message);
      } else {
        assertNever(message);
      }
    }
  }

  @Transactional()
  async find(query: { agendaId: string }): Promise<Agenda> {
    const foundAgenda = await this.db.tx.agenda.findUnique({
      select: {
        id: true,
        sessionId: true,
        officialReportId: true,
        date: true,
        sessionMeetingDate: true,
        chairmanId: true,
        nominationFiles: {
          where: { nominationFileId: { not: null } },
          select: { nominationFileId: true },
        },
      },
      where: { id: query.agendaId },
    });

    if (!foundAgenda) throw new NotFoundException();

    const snapshot = AgendaSnapshot.from({
      agendaId: makeId('AgendaId', foundAgenda.id),
      chairmanId: foundAgenda.chairmanId,
      date: DateOnly.fromDate(foundAgenda.date),
      sessionMeetingDate: DateOnly.fromDate(foundAgenda.sessionMeetingDate),
      nominationFileIds: new Set(
        foundAgenda.nominationFiles.flatMap((f) => (f.nominationFileId ? [f.nominationFileId] : [])),
      ),
    });

    return Agenda.from({
      snapshot,
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
      select: { formation: true, name: true },
    });

    if (!session) throw new InternalServerErrorException();
    const { formation, name } = session;

    return this.db.tx.agenda.create({
      data: {
        formation,
        sessionName: name.trim(),
        id: message.agendaId,
        chairmanFirstName: message.chairman.firstName,
        chairmanLastName: message.chairman.lastName,
        chairmanGender: message.chairman.gender,
        date: message.date,
        sessionMeetingDate: message.sessionMeetingDate,
        createdBy: message.authorId,
        chairmanId: message.chairman.id,
        chairmanTitle: message.chairman.title,
        chairmanDisplayTitle: message.chairman.displayTitle,
        sessionId: message.sessionId,
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
    });
  }

  private async persistAgendaMetadataUpdated(message: AgendaMetadataUpdated): Promise<void> {
    const chairman = await this.members.internalGetMember({ id: message.update.chairmanId });

    await this.db.tx.agenda.update({
      where: { id: message.agendaId },
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

    await this.invalidateAgendaDocument(message.agendaId);
  }

  private async persistAgendaFilesUpdated(message: AgendaFilesUpdated): Promise<void> {
    if (message.update.removed.length > 0) {
      await this.db.tx.agendaNominationFile.deleteMany({
        where: {
          agendaId: message.agendaId,
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
          agendaId: message.agendaId,
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

    await this.recomputeAgendaState(message.agendaId);
  }

  private async invalidateAgendaDocument(agendaId: string): Promise<void> {
    const agenda = await this.db.tx.agenda.findUnique({
      where: { id: agendaId },
      select: { pdfFileId: true },
    });

    await this.db.tx.agenda.update({
      where: { id: agendaId },
      data: { html: null, pdfFileId: null },
    });

    if (agenda?.pdfFileId) await this.db.tx.file.deleteMany({ where: { id: agenda.pdfFileId } });
  }

  private async persistAgendaDeleted(message: AgendaDeleted) {
    const found = await this.db.tx.agenda.findUnique({
      where: { id: message.agendaId },
      select: { pdfFileId: true, justicePresentationPlanId: true, officialReportId: true },
    });
    if (!found) return;

    if (found.pdfFileId) await this.db.tx.file.delete({ where: { id: found.pdfFileId } });
    if (found.officialReportId)
      await this.db.tx.officialReport.delete({ where: { id: found.officialReportId } });
    if (found.justicePresentationPlanId) {
      await this.db.tx.justicePresentationPlanToAgenda.delete({
        where: { agendaId: message.agendaId, planId: found.justicePresentationPlanId },
      });

      await this.db.tx.justicePresentationPlan.delete({ where: { id: found.justicePresentationPlanId } });
    }

    await this.db.tx.agenda.delete({ where: { id: message.agendaId } });
  }

  private async persistAgendaFileBlockEdited(message: AgendaFileBlockEdited) {
    await this.db.tx.agendaNominationFile.updateMany({
      where: { id: message.fileId, agendaId: message.agendaId },
      data: { htmlEdited: message.html, htmlOutdated: message.outdated },
    });

    await this.recomputeAgendaState(message.agendaId);
  }

  private async persistAgendaFileBlockReset(message: AgendaFileBlockReset) {
    await this.db.tx.agendaNominationFile.updateMany({
      where: { id: message.fileId, agendaId: message.agendaId },
      data: { htmlEdited: null, htmlOutdated: false },
    });

    await this.recomputeAgendaState(message.agendaId);
  }

  private async recomputeAgendaState(agendaId: string): Promise<void> {
    const manuallyEdited = await this.db.tx.agenda.findFirst({
      select: { id: true },
      where: { id: agendaId, nominationFiles: { some: { htmlEdited: { not: null } } } },
    });

    const outdated = await this.db.tx.agenda.findFirst({
      select: { id: true },
      where: { id: agendaId, nominationFiles: { some: { htmlOutdated: true } } },
    });

    await this.db.tx.agenda.update({
      where: { id: agendaId },
      data: { isManuallyEdited: isDefined(manuallyEdited), outdated: isDefined(outdated) },
    });

    await this.invalidateAgendaDocument(agendaId);
  }
}
