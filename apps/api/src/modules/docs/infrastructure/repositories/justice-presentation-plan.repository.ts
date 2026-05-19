import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';

import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/modules/framework/database';
import { prismaFormationEnumToFormationEnum } from 'src/modules/shared/mappers/formation.mapper';
import { assertNever } from 'src/utils/assert-never';
import { assertIsDefined } from 'src/utils/is-defined';
import { dateToTimeOnly, timeOnlyToDate } from 'src/utils/time-only';
import {
  JusticePresentationPlan,
  JusticePresentationPlanCreated,
  JusticePresentationPlanDeleted,
  JusticePresentationPlanPresented,
  JusticePresentationPlanUnPresented,
  JusticePresentationPlanUpdated,
} from '../../domain/justice-presentation-plan';
import { DocsNominationFilesFinder } from '../finders/docs-nomination-files.finder';

@Injectable()
export class JusticePresentationPlanRepository {
  private readonly logger = new Logger(JusticePresentationPlanRepository.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly docsNominationFilesFinder: DocsNominationFilesFinder,
  ) {}

  async find(query: { id: string; tx?: Prisma.TransactionClient }): Promise<JusticePresentationPlan> {
    if (!query.tx) return this.prisma.$transaction((tx) => this.find({ ...query, tx }));

    const found = await query.tx.justicePresentationPlan.findUnique({
      where: { id: query.id },
      select: {
        id: true,
        time: true,
        agendas: {
          take: 1,
          select: { agenda: { select: { formation: true } } },
        },
      },
    });

    if (!found || found.agendas.length === 0) throw new NotFoundException();
    return JusticePresentationPlan.from({
      id: found.id,
      formation: prismaFormationEnumToFormationEnum(assertIsDefined(found.agendas[0]).agenda.formation),
      startTime: dateToTimeOnly(found.time),
    });
  }

  async persist(plan: JusticePresentationPlan, tx?: Prisma.TransactionClient): Promise<void> {
    if (!tx) return this.prisma.$transaction((tx) => this.persist(plan, tx));

    for (const message of plan.messages) {
      if (
        message instanceof JusticePresentationPlanCreated ||
        message instanceof JusticePresentationPlanUpdated
      ) {
        await this.persistJusticePresentationPlanUpserted(tx, message);
      } else if (message instanceof JusticePresentationPlanDeleted) {
        await this.persistJusticePresentationPlanDeleted(tx, message);
      } else if (message instanceof JusticePresentationPlanPresented) {
        await this.persistJusticePresentationPlanPresented(tx, message);
      } else if (message instanceof JusticePresentationPlanUnPresented) {
        await this.persistJusticePresentationPlanUnPresented(tx, message);
      } else {
        assertNever(message);
      }
    }
  }

  private async persistJusticePresentationPlanUpserted(
    tx: Prisma.TransactionClient,
    message: JusticePresentationPlanCreated | JusticePresentationPlanUpdated,
  ) {
    const justiceContact = await tx.justiceDepartmentContact.findUnique({
      where: { id: BigInt(message.state.justiceContactId) },
      select: { id: true, name: true },
    });

    if (!justiceContact) {
      this.logger.error(`unknown justice contact: ${message.state.justiceContactId}`);
      throw new InternalServerErrorException();
    }

    const agendas = await tx.agenda.findMany({
      where: { id: { in: message.state.agendas.map(({ id }) => id) } },
      select: {
        sessionId: true,
        sessionName: true,
        nominationFiles: { select: { nominationFileId: true }, where: { nominationFileId: { not: null } } },
      },
    });

    const nominationFiles = await Promise.all(
      agendas.map(async ({ sessionId, sessionName, nominationFiles }) => {
        const { items } = await this.docsNominationFilesFinder.find({
          tx,
          sessionId,
          ids: nominationFiles.map(({ nominationFileId }) => nominationFileId as string),
        });

        return items.map((f) => ({ ...f, sessionId, sessionName }));
      }),
    ).then((result) => result.flat());

    const nominationFilesCreateMany = nominationFiles.map((f) => ({
      sessionId: f.sessionId,
      sessionName: f.sessionName,
      nominationFileId: f.id,
      number: f.number,
      name: f.magistrat.name,
      grade: f.magistrat.position.grade,
      position: f.magistrat.position.label,
      targetedPosition: f.targetPosition.label,
      targetedGrade: f.targetPosition.grade,
      outcome: f.outcome?.value ?? 'SUSPENDED',
      outcomeComment: f.outcome?.comment,
      reporters: f.reporters.map(({ fullTitledName }) => fullTitledName),
    }));

    const data = {
      date: message.state.date.toDate(),
      time: timeOnlyToDate(message.state.time),
      endTime: message.state.endingTime ? timeOnlyToDate(message.state.endingTime) : null,
      authorId: message.authorId,

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

    await tx.justicePresentationPlanToAgenda.deleteMany({
      where: { planId: message.id },
    });

    await tx.agenda.updateMany({
      data: { justicePresentationPlanId: null },
      where: { justicePresentationPlanId: message.id },
    });

    await tx.agenda.updateMany({
      data: { justicePresentationPlanId: message.id },
      where: { id: { in: message.state.agendas.map(({ id }) => id) } },
    });

    await tx.justicePresentationPlanNominationFile.deleteMany({ where: { planId: message.id } });

    await tx.justicePresentationPlan.upsert({
      where: { id: message.id },

      create: {
        ...data,
        html: null,
        pdfId: null,
        id: message.id,
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
  }

  private async persistJusticePresentationPlanDeleted(
    tx: Prisma.TransactionClient,
    message: JusticePresentationPlanDeleted,
  ) {
    await tx.justicePresentationPlanToAgenda.deleteMany({
      where: { planId: message.id },
    });

    await tx.agenda.updateMany({
      data: { justicePresentationPlanId: null },
      where: { justicePresentationPlanId: message.id },
    });

    const file = await tx.justicePresentationPlan.findUnique({
      where: { id: message.id },
      select: { pdf: { select: { id: true } } },
    });

    if (file?.pdf?.id) {
      await tx.file.delete({ where: { id: file.pdf.id } });
    }

    await tx.justicePresentationPlan.delete({
      where: { id: message.id },
    });
  }

  private async persistJusticePresentationPlanPresented(
    tx: Prisma.TransactionClient,
    message: JusticePresentationPlanPresented,
  ) {
    await tx.justicePresentationPlan.update({
      where: { id: message.id },
      data: { isPresented: true, endTime: timeOnlyToDate(message.endTime) },
    });
  }

  private async persistJusticePresentationPlanUnPresented(
    tx: Prisma.TransactionClient,
    message: JusticePresentationPlanUnPresented,
  ) {
    await tx.justicePresentationPlan.update({
      where: { id: message.id },
      data: { isPresented: false },
    });
  }
}
