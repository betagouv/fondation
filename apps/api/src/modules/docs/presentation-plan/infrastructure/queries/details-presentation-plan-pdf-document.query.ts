import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Prisma } from 'src/generated/prisma/client';
import { Db } from 'src/modules/framework/database';
import { Files } from 'src/modules/framework/files';

@Injectable()
export class DetailsPresentationPlanPdfDocumentQuery {
  constructor(
    private readonly files: Files,
    private readonly db: Db,
  ) {}

  /** handing out the stored pdf is a read: making one is validating, and only the author does that */
  async handle(query: { id: string }): Promise<DetailedPresentationPlanPdfDocumentDto> {
    const plan = await this.db.tx.justicePresentationPlan.findUnique({
      where: { id: query.id },
      select: { id: true, pdf: { select: { id: true } } } satisfies Prisma.JusticePresentationPlanSelect,
    });
    if (!plan?.pdf) throw new NotFoundException();

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
