import { Transactional } from '@nestjs-cls/transactional';
import { Injectable, NotFoundException } from '@nestjs/common';

import { AgendaVersionFinder } from '../finders/agenda-version.finder';
import { AgendaRenderer } from '../services/renderers/agenda.renderer';
import { Db } from 'src/modules/framework/database';

@Injectable()
export class FindAgendaDocumentQuery {
  constructor(
    private readonly db: Db,
    private readonly agendaRenderer: AgendaRenderer,
    private readonly agendaVersionFinder: AgendaVersionFinder,
  ) {}

  @Transactional()
  async handle(query: { id: string; forceNew?: boolean }): Promise<string> {
    const versionId = await this.agendaVersionFinder.latest({ agendaId: query.id });

    if (!query.forceNew) {
      const version = await this.db.tx.agendaVersion.findUnique({
        where: { id: versionId },
        select: { html: true },
      });

      if (!version) throw new NotFoundException();
      if (version.html) return version.html;
    }

    const html = await this.agendaRenderer.html({ agendaId: query.id });
    await this.db.tx.agendaVersion.update({
      where: { id: versionId },
      data: { html },
    });

    return html;
  }
}
