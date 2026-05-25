import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { PrismaService } from 'src/modules/framework/database';
import { Files } from 'src/modules/framework/files';

import { FindPresentationPlanDocumentPdfQuery } from './find-presentation-plan-document-pdf.query';

@Injectable()
export class DetailsPresentationPlanPdfDocumentQuery {
  constructor(
    private readonly files: Files,
    private readonly prisma: PrismaService,
    private readonly findPresentationPlanDocumentPdfQuery: FindPresentationPlanDocumentPdfQuery,
  ) {}

  async handle(query: { id: string }): Promise<DetailedPresentationPlanPdfDocumentDto> {
    return this.innerHandle({ ...query, afterGeneration: false });
  }

  private async innerHandle(query: {
    id: string;
    afterGeneration: boolean;
  }): Promise<DetailedPresentationPlanPdfDocumentDto> {
    const plan = await this.prisma.justicePresentationPlan.findUnique({
      where: { id: query.id, html: { not: null } },
      select: { id: true, pdf: { select: { id: true } } },
    });
    if (!plan) throw new NotFoundException();
    if (!plan.pdf && query.afterGeneration) throw new NotFoundException();

    if (!plan.pdf) {
      await this.findPresentationPlanDocumentPdfQuery.handle({ id: query.id, forceNew: false });
      return this.innerHandle({ ...query, afterGeneration: true });
    }

    const { [plan.pdf.id]: pdfFileUrl } = await this.files.getPublicUrls([plan.pdf.id]);
    if (!pdfFileUrl) throw new NotFoundException();

    return { id: plan.id, url: pdfFileUrl.toString() };
  }
}

export class DetailedPresentationPlanPdfDocumentDto extends createZodDto(
  z.object({
    id: z.string(),
    url: z.url(),
  }),
) {}
