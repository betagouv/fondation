import { Injectable } from '@nestjs/common';

import { PdfRenderer } from './pdf/pdf-renderer.service';
import { presentationPlanTemplate } from './templates/presentation-plan.html';

export type PresentationPlanRenderContext = typeof presentationPlanTemplate.$type;

@Injectable()
export class PresentationPlanRenderer {
  constructor(private readonly pdfRenderer: PdfRenderer) {}

  html(context: PresentationPlanRenderContext): string {
    return presentationPlanTemplate.render(context);
  }

  pdf(context: string | PresentationPlanRenderContext): Promise<Buffer> {
    const html = typeof context === 'string' ? context : this.html(context);

    return this.pdfRenderer.render(html);
  }
}
