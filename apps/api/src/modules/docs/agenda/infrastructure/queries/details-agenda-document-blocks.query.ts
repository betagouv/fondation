import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { AgendaRenderer } from '../services/renderers/agenda.renderer';

const AgendaBlockFileDtoSchema = z.object({
  kind: z.literal('file'),
  weight: z.number().int().gte(0),
  /** the nomination file the block stands for: removing the block drops that proposition */
  nominationFileId: z.string().nullable(),
  edited: z.boolean(),
  editedAt: z.iso.datetime().nullable(),
  editedBy: z.object({ id: z.string(), name: z.string() }).nullable(),
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

    return {
      blocks: blocks.map((block) => ({
        ...block,
        id: block.id.toString(),
        editedAt: block.editedAt?.toISOString() ?? null,
        editedBy: block.editedBy,
      })),
    };
  }
}

export class DetailedAgendaDocumentBlocksDto extends createZodDto(
  z.object({ blocks: z.array(AgendaBlockFileDtoSchema) }),
) {}
