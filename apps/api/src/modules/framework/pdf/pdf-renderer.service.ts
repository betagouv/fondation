import { Injectable, Logger } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { load } from 'cheerio';
import { documentPagedJs } from 'documents-assets';

import * as time from '../../../utils/time';

import { GotenbergHttpClient } from './gotenberg-http-client.service';

const WAIT_FOR_EXPRESSION = `window.status === 'OK'`;

const PAGED_JS = 'paged.polyfill.min.js';

@Injectable()
export class PdfRenderer {
  private readonly logger = new Logger(PdfRenderer.name);

  constructor(private readonly http: GotenbergHttpClient) {}

  render(html: string): Promise<Buffer> {
    return Sentry.startSpan(
      {
        name: `fr.csm.fondation:pdf:generation`,
        attributes: { payload_size: html.length, renderer: 'gotenberg' },
      },
      async (span) => {
        const start = performance.now();

        const buffer = await this.http.htmlToPdf({
          files: [new File([documentPagedJs()], PAGED_JS, { type: 'text/javascript' })],
          'index.html': this.withPagination(html),
          preferCssPageSize: true,
          printBackground: true,
          timeout: 1 * time.MINUTES,
          waitForExpression: WAIT_FOR_EXPRESSION,
        });

        const duration = (performance.now() - start).toFixed(3);

        this.logger.debug(`pdf generation: ${duration}ms`);
        span.setAttribute('output_file.bytes_size', buffer.byteLength);

        return buffer;
      },
    );
  }

  private withPagination(html: string): string {
    const $ = load(html);

    // the documents frozen before paged.js left the templates still load it from unpkg
    $('script[src*="paged"]').remove();
    $('head').prepend(/* html */ `
      <script>
        window.status = 'IDLE';
        window.PagedConfig = { after: () => { window.status = 'OK'; } };
      </script>
      <script defer src="${PAGED_JS}"></script>
    `);

    return $.html();
  }
}
