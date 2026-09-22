import { Propagation, Transactional } from '@nestjs-cls/transactional';
import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';

import { DocNominationFileOutcomeEnum } from '../../../shared/domain/doc-nomination-file-outcome';
import { AGENDA_CONTENT_VERSIONS, agendaContentOf } from '../../../shared/infrastructure/agenda-content';
import { DocsNominationFilesFinder } from '../../../shared/infrastructure/finders/docs-nomination-files.finder';
import {
  JusticePresentationPlan,
  JusticePresentationPlanContentChecked,
  JusticePresentationPlanCreated,
  JusticePresentationPlanDeleted,
  JusticePresentationPlanPresented,
  JusticePresentationPlanUnPresented,
  JusticePresentationPlanUpdated,
} from '../../domain/justice-presentation-plan';
import { JusticePresentationPlanContent } from '../../domain/justice-presentation-plan-content';
import { presentationPlanStatusOf } from '../presentation-plan-status';
import { Prisma } from 'src/generated/prisma/client';
import { Clock } from 'src/modules/framework/clock';
import { Db } from 'src/modules/framework/database';
import { Files } from 'src/modules/framework/files';
import { prismaFormationEnumToFormationEnum } from 'src/modules/shared/mappers/formation.mapper';
import { assertNever } from 'src/utils/assert-never';
import { assertIsDefined, isDefined } from 'src/utils/is-defined';
import { dateToTimeOnly, timeOnlyToDate } from 'src/utils/time-only';

@Injectable()
export class JusticePresentationPlanRepository {
  private readonly logger = new Logger(JusticePresentationPlanRepository.name);

  constructor(
    private readonly clock: Clock,
    private readonly db: Db,
    private readonly docsNominationFilesFinder: DocsNominationFilesFinder,
    private readonly files: Files,
  ) {}

  @Transactional()
  async find(query: { id: string }): Promise<JusticePresentationPlan> {
    const found = await this.db.tx.justicePresentationPlan.findUnique({
      where: { id: query.id },
      select: {
        id: true,
        pdfId: true,
        isPresented: true,
        outdated: true,
        time: true,
        agendas: {
          select: { agendaId: true, agenda: { select: { formation: true } } },
        },
        nominationFiles: {
          select: {
            name: true,
            nominationFileId: true,
            number: true,
            outcome: true,
            outcomeComment: true,
            targetedGrade: true,
            targetedPosition: true,
          },
        },
      },
    });

    if (!found || found.agendas.length === 0) throw new NotFoundException();
    return JusticePresentationPlan.from({
      id: found.id,
      formation: prismaFormationEnumToFormationEnum(assertIsDefined(found.agendas[0]).agenda.formation),
      startTime: dateToTimeOnly(found.time),
      agendaIds: found.agendas.map(({ agendaId }) => agendaId),
      isValidated: presentationPlanStatusOf(found) === 'VALIDATED',
      isPresented: found.isPresented,
      outdated: found.outdated,
      content: JusticePresentationPlanContent.from(
        found.nominationFiles.flatMap(({ nominationFileId, ...file }) =>
          isDefined(nominationFileId) ? [{ ...file, nominationFileId }] : [],
        ),
      ),
    });
  }

  @Transactional(Propagation.Mandatory)
  async persist(plan: JusticePresentationPlan): Promise<void> {
    for (const message of plan.messages) {
      if (
        message instanceof JusticePresentationPlanCreated ||
        message instanceof JusticePresentationPlanUpdated
      ) {
        await this.persistJusticePresentationPlanUpserted(message);
      } else if (message instanceof JusticePresentationPlanDeleted) {
        await this.persistJusticePresentationPlanDeleted(message);
      } else if (message instanceof JusticePresentationPlanPresented) {
        await this.persistJusticePresentationPlanPresented(message);
      } else if (message instanceof JusticePresentationPlanUnPresented) {
        await this.persistJusticePresentationPlanUnPresented(message);
      } else if (message instanceof JusticePresentationPlanContentChecked) {
        await this.persistJusticePresentationPlanContentChecked(message);
      } else {
        assertNever(message);
      }
    }
  }

  private async persistJusticePresentationPlanUpserted(
    message: JusticePresentationPlanCreated | JusticePresentationPlanUpdated,
  ) {
    const justiceContact = await this.db.tx.justiceDepartmentContact.findUnique({
      where: { id: BigInt(message.state.justiceContactId) },
      select: { id: true, name: true },
    });

    if (!justiceContact) {
      this.logger.error(`unknown justice contact: ${message.state.justiceContactId}`);
      throw new InternalServerErrorException();
    }

    const agendas = await this.db.tx.agenda.findMany({
      where: { id: { in: message.state.agendas.map(({ id }) => id) } },
      select: {
        id: true,
        sessionId: true,
        sessionName: true,
        formation: true,
        versions: {
          ...AGENDA_CONTENT_VERSIONS,
          select: {
            status: true,
            nominationFiles: {
              select: { nominationFileId: true },
              where: { nominationFileId: { not: null } },
            },
          },
        },
      },
    });

    const nominationFiles = await Promise.all(
      agendas.map(async ({ id: agendaId, sessionId, sessionName, formation, versions }) => {
        const { items } = await this.docsNominationFilesFinder.find({
          sessionId,
          formation: prismaFormationEnumToFormationEnum(formation),
          ids: (agendaContentOf(versions)?.nominationFiles ?? []).map(
            ({ nominationFileId }) => nominationFileId as string,
          ),
        });

        return items
          .filter((file) => JusticePresentationPlanRepository.hasOutcome(file))
          .map((f) => ({ ...f, agendaId, sessionId, sessionName }));
      }),
    ).then((result) => result.flat());

    const nominationFilesCreateMany = nominationFiles.map((f) => ({
      agendaId: f.agendaId,
      sessionId: f.sessionId,
      sessionName: f.sessionName,
      nominationFileId: f.id,
      number: f.number,
      name: f.magistrat.name,
      grade: f.magistrat.position.grade,
      position: f.magistrat.position.label,
      targetedPosition: f.targetPosition.label,
      targetedGrade: f.targetPosition.grade,
      outcome: f.outcome.value,
      outcomeComment: f.outcome.comment,
      reporters: f.reporters.map(({ fullTitledName }) => fullTitledName),
    }));

    const data = {
      outdated: false,
      isManuallyEdited: false,
      date: message.state.date.toDate(),
      time: timeOnlyToDate(message.state.time),
      endTime: message.state.endingTime ? timeOnlyToDate(message.state.endingTime) : null,
      hasRenunciation: message.state.hasRenunciation,

      chairmanId: message.state.chairman.id,
      chairmanFirstName: message.state.chairman.firstName,
      chairmanLastName: message.state.chairman.lastName,
      chairmanGender: message.state.chairman.gender,
      chairmanTitle: message.state.chairman.title,
      chairmanDisplayTitle: message.state.chairman.displayTitle,

      secretaryId: message.state.secretary.id,
      secretaryFirstName: message.state.secretary.firstName,
      secretaryLastName: message.state.secretary.lastName,
      secretaryGender: message.state.secretary.gender,
      secretaryTitle: message.state.secretary.title,
      secretaryDisplayTitle: message.state.secretary.displayTitle,

      justiceDepartmentContactId: justiceContact.id,
      justiceDepartmentContactName: justiceContact.name,
    } satisfies Prisma.JusticePresentationPlanUncheckedUpdateInput;

    await this.db.tx.justicePresentationPlanToAgenda.deleteMany({
      where: { planId: message.id },
    });

    await this.db.tx.agenda.updateMany({
      data: { justicePresentationPlanId: null },
      where: { justicePresentationPlanId: message.id },
    });

    await this.db.tx.agenda.updateMany({
      data: { justicePresentationPlanId: message.id },
      where: { id: { in: message.state.agendas.map(({ id }) => id) } },
    });

    const stale = await this.db.tx.justicePresentationPlan.findUnique({
      where: { id: message.id },
      select: { pdf: { select: { id: true, path: true } } },
    });

    await this.db.tx.justicePresentationPlanMember.deleteMany({ where: { planId: message.id } });
    await this.db.tx.justicePresentationPlanNominationFile.deleteMany({ where: { planId: message.id } });

    await this.db.tx.justicePresentationPlan.upsert({
      where: { id: message.id },

      create: {
        ...data,
        members: {
          createMany: { data: message.state.members.map((m) => ({ memberId: m.id, isAbsent: m.isAbsent })) },
        },
        html: null,
        pdfId: null,
        id: message.id,
        createdBy: message.authorId,
        updatedAt: null,
        updatedBy: null,
        nominationFiles: { createMany: { data: nominationFilesCreateMany } },
        agendas: {
          createMany: {
            data: message.state.agendas.map(({ comment, id }) => ({
              agendaId: id,
              comment: comment || undefined,
            })),
          },
        },
      },

      update: {
        ...data,
        html: null,
        pdfId: null,
        updatedAt: this.clock.now(),
        updatedBy: message.authorId,
        members: {
          createMany: { data: message.state.members.map((m) => ({ memberId: m.id, isAbsent: m.isAbsent })) },
        },
        nominationFiles: { createMany: { data: nominationFilesCreateMany } },
        agendas: {
          createMany: {
            data: message.state.agendas.map(({ comment, id }) => ({
              agendaId: id,
              comment: comment || undefined,
            })),
          },
        },
      },
    });

    if (stale?.pdf) this.files.delete([stale.pdf]);
  }

  private async persistJusticePresentationPlanDeleted(message: JusticePresentationPlanDeleted) {
    await this.db.tx.justicePresentationPlanToAgenda.deleteMany({
      where: { planId: message.id },
    });

    await this.db.tx.agenda.updateMany({
      data: { justicePresentationPlanId: null },
      where: { justicePresentationPlanId: message.id },
    });

    const file = await this.db.tx.justicePresentationPlan.findUnique({
      where: { id: message.id },
      select: { pdf: { select: { id: true, path: true } } },
    });

    await this.db.tx.justicePresentationPlan.delete({
      where: { id: message.id },
    });

    if (file?.pdf) this.files.delete([file.pdf]);
  }

  private async persistJusticePresentationPlanPresented(message: JusticePresentationPlanPresented) {
    await this.db.tx.justicePresentationPlan.update({
      where: { id: message.id },
      data: {
        isPresented: true,
        endTime: timeOnlyToDate(message.endTime),
        presentedAt: this.clock.now(),
        presentedBy: message.presenterId,
      },
    });
  }

  private async persistJusticePresentationPlanUnPresented(message: JusticePresentationPlanUnPresented) {
    await this.db.tx.justicePresentationPlan.update({
      where: { id: message.id },
      data: { isPresented: false, presentedAt: null, presentedBy: null },
    });
  }

  private async persistJusticePresentationPlanContentChecked(message: JusticePresentationPlanContentChecked) {
    await this.db.tx.justicePresentationPlan.update({
      where: { id: message.id },
      data: { outdated: message.outdated },
    });
  }

  private static hasOutcome<
    T extends { outcome: { value: DocNominationFileOutcomeEnum; comment: string | null } | null },
  >(file: T): file is T & { outcome: NonNullable<T['outcome']> } {
    return isDefined(file.outcome);
  }
}
