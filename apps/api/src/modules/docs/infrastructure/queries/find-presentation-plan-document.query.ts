import { Injectable, NotFoundException } from '@nestjs/common';

import { TypeDeSaisine } from 'shared-models';

import { PrismaService } from 'src/modules/framework/database';
import { prismaFormationEnumToFormationEnum } from 'src/modules/shared/mappers/formation.mapper';
import { DateOnly } from 'src/utils/date-only';
import { assertIsDefined, isDefined } from 'src/utils/is-defined';
import { dateToTimeOnly } from 'src/utils/time-only';
import { DocNominationFileOutcomeEnum } from '../../domain/doc-nomination-file-outcome';
import {
  PresentationPlanRenderContext,
  PresentationPlanRenderer,
} from '../services/renderers/presentation-plan.renderer';

@Injectable()
export class FindPresentationPlanDocumentQuery {
  constructor(
    private readonly prisma: PrismaService,
    private readonly presentationPlanRenderer: PresentationPlanRenderer,
  ) {}

  handle(query: { id: string; forceNew?: boolean }): Promise<string> {
    return this.prisma.$transaction(async (tx) => {
      if (!query.forceNew) {
        const plan = await tx.justicePresentationPlan.findUnique({
          where: { id: query.id },
          select: { html: true },
        });

        if (!plan) throw new NotFoundException();
        if (plan.html) return plan.html;
      }

      const plan = await tx.justicePresentationPlan.findUnique({
        where: { id: query.id },
        select: {
          id: true,
          date: true,
          time: true,
          hasRenunciation: true,

          justiceDepartmentContactName: true,

          nominationFiles: {
            select: {
              agendaId: true,
              number: true,
              name: true,
              targetedGrade: true,
              targetedPosition: true,
              outcome: true,
              outcomeComment: true,
              sessionId: true,
              sessionName: true,
            },
          },

          agendas: {
            select: {
              agendaId: true,
              comment: true,
              agenda: {
                select: {
                  date: true,
                  formation: true,
                  sessionId: true,
                  sessionName: true,
                  sessionMeetingDate: true,
                  chairmanId: true,
                  chairmanFirstName: true,
                  chairmanLastName: true,
                },
              },
            },
          },

          secretaryFirstName: true,
          secretaryLastName: true,
        },
      });

      if (!plan) throw new NotFoundException();

      const sessions: PresentationPlanRenderContext['sessions'] = Map.groupBy(
        plan.agendas,
        ({ agenda }) => agenda.sessionId,
      )
        .values()
        .map((sessionAgendas) => {
          const { agenda } = assertIsDefined(
            sessionAgendas.find(({ agenda }) => isDefined(agenda)),
            `unknown agenda`,
          );
          const { sessionId, sessionName, formation } = agenda;

          const agendas = Map.groupBy(
            sessionAgendas,
            ({ agenda }) => agenda.chairmanId || `${agenda.chairmanFirstName}|${agenda.chairmanLastName}`,
          )
            .values()
            .map((group) => {
              const agendaIds = new Set(group.map((a) => a.agendaId));
              const nominationFiles = plan.nominationFiles.filter(
                (f): f is typeof f & { targetedPosition: string; outcome: DocNominationFileOutcomeEnum } =>
                  agendaIds.has(f.agendaId) && isDefined(f.targetedPosition) && isDefined(f.outcome),
              );

              const { agenda: firstAgenda } = assertIsDefined(
                group.find(({ agenda }) => isDefined(agenda)),
                `unknown agenda`,
              );
              const { chairmanFirstName, chairmanLastName } = assertIsDefined(firstAgenda, 'unknown agenda');

              return {
                nominationFiles,
                chairman: { firstName: chairmanFirstName, lastName: chairmanLastName },
                comments: group.map(({ comment }) => comment),
              };
            })
            .toArray();

          return {
            agendas,
            id: sessionId,
            name: sessionName,
            // TODO: change when other are available
            typeDeSaisine: TypeDeSaisine.TRANSPARENCE_GDS,
            formation: prismaFormationEnumToFormationEnum(formation),
          };
        })
        .toArray();

      const html = this.presentationPlanRenderer.html({
        sessions,
        date: DateOnly.fromDate(plan.date),
        time: dateToTimeOnly(plan.time),
        hasRenunciation: plan.hasRenunciation,
        justiceContactName: plan.justiceDepartmentContactName,
        typeDeSaisine: sessions[0]!.typeDeSaisine,
        formation: sessions[0]!.formation,
        secretary: { firstName: plan.secretaryFirstName, lastName: plan.secretaryLastName },
      });

      await tx.justicePresentationPlan.update({
        where: { id: query.id },
        data: { html },
      });

      return html;
    });
  }
}
