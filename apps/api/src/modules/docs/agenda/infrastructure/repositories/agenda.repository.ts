import { Propagation, Transactional } from '@nestjs-cls/transactional';
import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';

import {
  Agenda,
  AgendaCreated,
  AgendaDeleted,
  AgendaFileBlockEdited,
  AgendaFileBlockReset,
  AgendaUpdated,
} from '../../domain/agenda';
import { OfficialReportInvalidation } from 'src/modules/docs/shared/domain/invalidation/official-report-invalidated.integration-event';
import { Db } from 'src/modules/framework/database';
import { assertNever } from 'src/utils/assert-never';
import { DateOnly } from 'src/utils/date-only';
import { makeId } from 'src/utils/id';
import { isDefined } from 'src/utils/is-defined';

@Injectable()
export class AgendaRepository {
  constructor(private readonly db: Db) {}

  @Transactional(Propagation.Mandatory)
  async persist(agenda: Agenda): Promise<OfficialReportInvalidation[]> {
    let invalidations: OfficialReportInvalidation[] = [];

    for (const message of agenda.messages) {
      if (message instanceof AgendaCreated) {
        await this.persistAgendaCreated(message);
      } else if (message instanceof AgendaUpdated) {
        invalidations = await this.persistAgendaUpdated(message);
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

    return invalidations;
  }

  @Transactional()
  async find(query: { agendaId: string }): Promise<Agenda> {
    const foundAgenda = await this.db.tx.agenda.findUnique({
      select: { id: true, sessionId: true, officialReportId: true },
      where: { id: query.agendaId },
    });

    if (!foundAgenda) throw new NotFoundException();

    return Agenda.from({
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

  private async persistAgendaUpdated(message: AgendaUpdated): Promise<OfficialReportInvalidation[]> {
    const invalidations: OfficialReportInvalidation[] = [];

    await this.db.tx.agendaNominationFile.deleteMany({
      where: { agendaId: message.agendaId },
    });

    const agenda = await this.db.tx.agenda.findFirst({
      select: {
        pdf: { select: { id: true } },
        officialReportId: true,
        date: true,
        nominationFiles: { select: { nominationFileId: true } },
      },
      where: { id: message.agendaId },
    });

    if (message.date.getTime() !== agenda?.date.getTime()) {
      invalidations.push({
        type: 'AgendaDateUpdated',
        payload: { agendaId: message.agendaId, date: DateOnly.fromDate(message.date).toJson() },
      });
    }

    const nominationFileIds = new Set(
      agenda?.nominationFiles.flatMap(({ nominationFileId }) => (nominationFileId ? [nominationFileId] : [])),
    );
    const difference = nominationFileIds.difference(new Set(message.nominationFiles.map(({ id }) => id)));
    if (difference.size > 0)
      invalidations.push({ type: 'AgendaNominationFilesUpdated', payload: { agendaId: message.agendaId } });

    if (agenda?.pdf?.id) {
      await this.db.tx.agenda.update({
        where: { id: message.agendaId },
        data: { pdfFileId: null },
      });

      await this.db.tx.file.deleteMany({
        where: { id: agenda.pdf.id },
      });
    }

    if (agenda?.officialReportId) {
      await this.db.tx.officialReport.delete({
        where: { id: agenda.officialReportId },
      });
    }

    await this.db.tx.agenda.update({
      where: { id: message.agendaId },
      data: {
        html: null,
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

    return invalidations;
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

    const agenda = await this.db.tx.agenda.findUnique({
      where: { id: agendaId },
      select: { pdfFileId: true },
    });

    await this.db.tx.agenda.update({
      where: { id: agendaId },
      data: {
        html: null,
        pdfFileId: null,
        isManuallyEdited: isDefined(manuallyEdited),
        outdated: isDefined(outdated),
      },
    });

    if (agenda?.pdfFileId) await this.db.tx.file.deleteMany({ where: { id: agenda.pdfFileId } });
  }
}
