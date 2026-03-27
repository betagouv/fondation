import { Injectable } from '@nestjs/common';

import { PdfRenderer } from './pdf/pdf-renderer.service';
import { agendaTemplate } from './templates/agenda.html';

export type AgendaRenderContext = typeof agendaTemplate.$type;

@Injectable()
export class AgendaRenderer {
  constructor(private readonly pdfRenderer: PdfRenderer) {}

  html(ctx: AgendaRenderContext): string {
    return agendaTemplate.render(ctx);
  }

  pdf(ctx: string | AgendaRenderContext): Promise<Buffer> {
    const html = typeof ctx === 'string' ? ctx : this.html(ctx);

    return this.pdfRenderer.render(html);
  }
}
