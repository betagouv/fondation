import { Injectable } from '@nestjs/common';

import { AgendaBlockFile } from '../../../domain/agenda-doc-block';
import { AgendaRenderContextFinder } from '../../finders/agenda-render-context.finder';

import { agendaBlocks, agendaTemplate, type AgendaRenderContext } from './agenda.html';

export type { AgendaRenderContext };

@Injectable()
export class AgendaRenderer {
  constructor(private readonly contextFinder: AgendaRenderContextFinder) {}

  async html(query: { agendaId: string }): Promise<string> {
    const ctx = await this.contextFinder.find(query);

    return agendaTemplate.render(ctx);
  }

  async blocks(query: { agendaId: string }): Promise<AgendaBlockFile[]> {
    const ctx = await this.contextFinder.find(query);

    return Array.from(agendaBlocks(ctx));
  }
}
