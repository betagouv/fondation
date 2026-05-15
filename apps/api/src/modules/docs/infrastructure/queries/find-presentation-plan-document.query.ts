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

          justiceDepartmentContactName: true,

          agendas: {
            select: {
              comment: true,
              agenda: {
                select: {
                  date: true,
                  formation: true,
                  sessionName: true,
                  sessionMeetingDate: true,
                  chairmanFirstName: true,
                  chairmanLastName: true,
                  nominationFiles: {
                    select: {
                      number: true,
                      name: true,
                      targetedGrade: true,
                      targetedPosition: true,
                      outcome: true,
                      outcomeComment: true,
                    },
                  },
                },
              },
            },
          },

          secretaryFirstName: true,
          secretaryLastName: true,
        },
      });

      if (!plan) throw new NotFoundException();

      const ctx = {
        // TODO: change when other are available
        typeDeSaisine: TypeDeSaisine.TRANSPARENCE_GDS,
        date: DateOnly.fromDate(plan.date),
        time: dateToTimeOnly(plan.time),
        formation: prismaFormationEnumToFormationEnum(
          assertIsDefined(plan.agendas[0]!.agenda.formation, 'unknown plan formation'),
        ),
        justiceContactName: plan.justiceDepartmentContactName,
        secretary: {
          firstName: plan.secretaryFirstName,
          lastName: plan.secretaryLastName,
        },
        agendas: plan.agendas.map((a) => ({
          comment: a.comment,
          sessionName: a.agenda.sessionName,
          chairman: {
            firstName: a.agenda.chairmanFirstName,
            lastName: a.agenda.chairmanLastName,
          },
          nominationFiles: a.agenda.nominationFiles.filter(
            (
              file,
            ): file is typeof file & { targetedPosition: string; outcome: DocNominationFileOutcomeEnum } =>
              isDefined(file.targetedPosition) && isDefined(file.outcome),
          ),
        })),
      } satisfies PresentationPlanRenderContext;
      const html = this.presentationPlanRenderer.html(ctx);

      await tx.justicePresentationPlan.update({
        where: { id: query.id },
        data: { html },
      });

      return html;
    });
  }
}
