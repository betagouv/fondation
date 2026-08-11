import { Transactional } from '@nestjs-cls/transactional';
import { Injectable, NotFoundException } from '@nestjs/common';

import { AgendaRenderer } from '../services/renderers/agenda.renderer';
import { Db } from 'src/modules/framework/database';

@Injectable()
export class FindAgendaDocumentQuery {
  constructor(
    private readonly db: Db,
    private readonly agendaRenderer: AgendaRenderer,
  ) {}

  @Transactional()
  async handle(query: { id: string; forceNew?: boolean }): Promise<string> {
    if (!query.forceNew) {
      const agenda = await this.db.tx.agenda.findUnique({
        where: { id: query.id },
        select: { id: true, html: true },
      });

      if (!agenda) throw new NotFoundException();
      if (agenda.html) return agenda.html;
    }

    const html = await this.agendaRenderer.html({ agendaId: query.id });
    await this.db.tx.agenda.update({
      where: { id: query.id },
      data: { html },
    });

    return html;
  }
}
