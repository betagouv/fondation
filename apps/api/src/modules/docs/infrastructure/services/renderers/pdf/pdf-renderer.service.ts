import path from 'node:path';

import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import Piscina from 'piscina';

@Injectable()
export class PdfRenderer implements OnModuleDestroy {
  private readonly logger = new Logger();
  #pool: Piscina | null = null;

  async onModuleDestroy(): Promise<void> {
    await this.#pool?.destroy();
  }

  render(html: string): Promise<Buffer> {
    return Sentry.startSpan(
      {
        name: `fr.csm.fondation:pdf:generation`,
        attributes: { payload_size: html.length },
      },
      () => this.internalRender(html),
    );
  }

  private async internalRender(html: string): Promise<Buffer> {
    const start = performance.now();
    const buffer: Uint8Array = await this.pool.run(html);
    const duration = (performance.now() - start).toFixed(3);
    this.logger.debug(`pdf generation: ${duration}ms`);

    Sentry.getActiveSpan()?.setAttribute('output_file.bytes_size', buffer.byteLength);

    return Buffer.from(buffer);
  }

  private get pool(): Piscina {
    if (!this.#pool) {
      this.logger.debug(`Starting the worker pool...`);

      const ext = __filename.endsWith('.ts') ? '.ts' : '.js';
      const filename = path.resolve(__dirname, `pdf-worker${ext}`);

      this.#pool = Sentry.startSpan(
        {
          attributes: { filename },
          name: `fr.csm.fondation:pdf:start_pool`,
        },
        () =>
          new Piscina({
            filename,
            execArgv: process.execArgv,
            minThreads: 1,
            maxThreads: 2,
          }),
      );
    }

    return this.#pool;
  }
}
