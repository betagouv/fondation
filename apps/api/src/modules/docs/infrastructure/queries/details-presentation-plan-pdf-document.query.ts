import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import { PrismaService } from 'src/modules/framework/database';
import { Files } from 'src/modules/framework/files';
import z from 'zod';

@Injectable()
export class DetailsPresentationPlanPdfDocumentQuery {
  constructor(
    private readonly prisma: PrismaService,
    private readonly files: Files,
  ) {}

  async handle(query: {
    id: string;
  }): Promise<DetailedPresentationPlanPdfDocumentDto> {
    const plan = await this.prisma.justicePresentationPlan.findUnique({
      where: { id: query.id },
      select: { id: true, pdf: { select: { id: true } } },
    });
    if (!plan || !plan.pdf?.id) throw new NotFoundException();

    const { [plan.pdf.id]: pdfFileUrl } = await this.files.getPublicUrls([
      plan.pdf.id,
    ]);

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
