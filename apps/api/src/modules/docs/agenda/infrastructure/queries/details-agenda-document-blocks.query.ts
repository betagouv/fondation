import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { AgendaRenderer } from '../services/renderers/agenda.renderer';

const AgendaBlockFileDtoSchema = z.object({
  kind: z.literal('file'),
  weight: z.number().int().gte(0),
  edited: z.boolean(),
  outdated: z.boolean(),
  generatedHtml: z.string().optional(),
  html: z.string(),
  id: z.string(),
});

@Injectable()
export class DetailsAgendaDocumentBlocksQuery {
  constructor(private readonly agendaRenderer: AgendaRenderer) {}

  async handle(query: { agendaId: string }): Promise<DetailedAgendaDocumentBlocksDto> {
    const blocks = await this.agendaRenderer.blocks(query);

    return { blocks: blocks.map((block) => ({ ...block, id: block.id.toString() })) };
  }
}

export class DetailedAgendaDocumentBlocksDto extends createZodDto(
  z.object({ blocks: z.array(AgendaBlockFileDtoSchema) }),
) {}
