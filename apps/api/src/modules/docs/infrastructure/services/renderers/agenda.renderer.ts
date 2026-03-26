import { Injectable, NotImplementedException } from '@nestjs/common';

import { HtmlRenderer } from './html.renderer';
import { PdfRenderer } from './pdf/pdf-renderer.service';
import { AgendaTemplateContext } from './templates/agenda.html';

export type AgendaRenderContext = {
  date: Date;
  sessionMeetingDate: Date;
  chairman: {
    firstName: string;
    lastName: string;
    title: string | null;
    gender: string;
  };
  nominationFiles: Array<{
    number: number;
    name: string;
    grade: string;
    position: string;
    targetedPosition: string;
    targetedGrade: string;
    outcome: string;
    outcomeComment: string | null;
  }>;
};

@Injectable()
export class AgendaRenderer {
  constructor(
    private readonly htmlRenderer: HtmlRenderer<AgendaTemplateContext>,
    private readonly pdfRenderer: PdfRenderer,
  ) {}

  /* eslint-disable */
  html(_query: { id: string }): Promise<string> {
    throw new NotImplementedException();
  }
  pdf(context: any): Promise<Buffer> {
    throw new NotImplementedException();
  }
  /* eslint-enable */

  private static toTemplateContext(
    _context: AgendaRenderContext, // eslint-disable-line @typescript-eslint/no-unused-vars
  ): AgendaTemplateContext {
    throw new NotImplementedException();
  }
}
