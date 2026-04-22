import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/modules/framework/database';
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

      // TODO: complete according to render context.
      // eslint-disable-next-line
      const _context = await tx.justicePresentationPlan.findUnique({
        where: { id: query.id },
        select: {
          id: true,
          date: true,
          time: true,

          agendas: {
            select: {
              comment: true,
              agenda: {
                select: {
                  date: true,
                  formation: true,
                  sessionName: true,
                  sessionMeetingDate: true,
                },
              },
            },
          },

          chairmanDisplayTitle: true,
          chairmanFirstName: true,
          chairmanLastName: true,
          chairmanGender: true,
          chairmanTitle: true,

          secretaryDisplayTitle: true,
          secretaryFirstName: true,
          secretaryLastName: true,
          secretaryGender: true,
          secretaryTitle: true,
        },
      });

      const ctx = {} as unknown as PresentationPlanRenderContext;
      const html = this.presentationPlanRenderer.html(ctx);

      await tx.justicePresentationPlan.update({
        where: { id: query.id },
        data: { html },
      });

      return html;
    });
  }
}
