import { Injectable, Logger } from '@nestjs/common';
import * as Sentry from '@sentry/node';

import * as time from 'src/utils/time';

import { GotenbergHttpClient } from './gotenberg-http-client.service';

const WAIT_FOR_EXPRESSION = `window.status === 'OK'`;

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
          timeout: 1 * time.MINUTES,
          'index.html': this.withReadyStatus(html),
          waitForExpression: WAIT_FOR_EXPRESSION,
          preferCssPageSize: true,
          printBackground: true,
        });

        const duration = (performance.now() - start).toFixed(3);

        this.logger.debug(`pdf generation: ${duration}ms`);
        span.setAttribute('output_file.bytes_size', buffer.byteLength);

        return buffer;
      },
    );
  }

  private withReadyStatus(html: string): string {
    return html.replace(
      '<head>',
      /* html */ `<head>
      <script>
        window.status = 'IDLE';
        window.PagedConfig = { after: () => { window.status = 'OK'; } };
      </script>\n`,
    );
  }
}
