import { Injectable } from '@nestjs/common';

import { GotenbergPdfRenderer } from './gotenberg-pdf-renderer.service';
import { PuppeteerPdfRenderer } from './puppeteer-pdf-renderer.service';

@Injectable()
export class PdfRenderer {
  constructor(
    private readonly gotenberg: GotenbergPdfRenderer,
    private readonly puppeteer: PuppeteerPdfRenderer,
  ) {}

  async render(html: string): Promise<Buffer> {
    if (await this.gotenberg.isAvailable()) return this.gotenberg.render(html);
    return this.puppeteer.render(html);
  }
}
