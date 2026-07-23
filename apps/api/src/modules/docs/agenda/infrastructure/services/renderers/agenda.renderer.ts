import { Injectable } from '@nestjs/common';

import { agendaTemplate } from './agenda.html';

export type AgendaRenderContext = typeof agendaTemplate.$type;

@Injectable()
export class AgendaRenderer {
  html(ctx: AgendaRenderContext): string {
    return agendaTemplate.render(ctx);
  }
}
