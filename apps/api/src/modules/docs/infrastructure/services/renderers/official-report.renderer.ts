import { Injectable } from '@nestjs/common';

import { PdfRenderer } from './pdf/pdf-renderer.service';
import { officialReportTemplate } from './templates/official-report.html';

export type OfficialReportRenderContext = typeof officialReportTemplate.$type;

@Injectable()
export class OfficialReportRenderer {
  constructor(private readonly pdfRenderer: PdfRenderer) {}

  html(ctx: OfficialReportRenderContext): string {
    return officialReportTemplate.render(ctx);
  }

  pdf(ctx: string | OfficialReportRenderContext): Promise<Buffer> {
    const html = typeof ctx === 'string' ? ctx : this.html(ctx);

    return this.pdfRenderer.render(html);
  }
}
