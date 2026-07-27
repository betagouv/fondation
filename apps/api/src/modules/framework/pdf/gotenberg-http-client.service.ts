import { HttpService } from '@nestjs/axios';
import { Logger } from '@nestjs/common';
import { firstValueFrom, map } from 'rxjs';

import { Clock } from '../clock';

export class GotenbergHttpClient {
  private readonly logger = new Logger(GotenbergHttpClient.name);
  private readonly cache = new Map<string, { lastCheckedAt: Date; result: unknown }>();
  private readonly urls = {
    health: `/health`,
    htmlToPdf: `/forms/chromium/convert/html`,
  };

  constructor(
    private readonly clock: Clock,
    private readonly http: HttpService,
    private readonly baseUrl: URL,
  ) {}

  async htmlToPdf(request: {
    timeout?: number;

    'index.html': string;
    files?: readonly File[];
    waitForExpression?: string;
    printBackground?: boolean;
    preferCssPageSize?: boolean;
  }): Promise<Buffer> {
    const form = new FormData();
    form.append('files', new File([request['index.html']], 'index.html', { type: 'text/html' }));

    type Field = Exclude<keyof typeof request, 'index.html' | 'timeout' | 'files'>[];
    for (const field of ['waitForExpression', 'printBackground', 'preferCssPageSize'] satisfies Field) {
      if (!(field in request)) continue;

      form.append(field, String(request[field]));
    }

    for (const file of request.files ?? []) {
      form.append('files', file);
    }

    const url = new URL(this.urls.htmlToPdf, this.baseUrl).toString();
    const response = await firstValueFrom(
      this.http.post<ArrayBuffer>(url, form, { timeout: request.timeout, responseType: 'arraybuffer' }),
    );

    return Buffer.from(response.data);
  }

  async health(options: { ttl?: number; timeout?: number } = {}): Promise<boolean> {
    const { ttl = 0, timeout = 2_000 } = options;

    return this.cached({
      ttl,
      key: 'health',
      action: async () => {
        const url = new URL(this.urls.health, this.baseUrl).toString();

        try {
          const response$ = this.http.get(url, { timeout, validateStatus: () => true });
          return await firstValueFrom(response$.pipe(map(({ status }) => status >= 200 && status < 400)));
        } catch (error) {
          this.logger.warn(`check health failed`, error);

          return false;
        }
      },
    });
  }

  private async cached<T>(options: { ttl: number; action: () => Promise<T>; key: string }): Promise<T> {
    let entry = this.cache.get(options.key) ?? { lastCheckedAt: new Date(0), result: null };
    const now = this.clock.now();
    const duration = now.getTime() - entry.lastCheckedAt.getTime();

    if (duration >= options.ttl) {
      const result = await options.action();
      entry = { result, lastCheckedAt: now };
      this.cache.set(options.key, entry);
    }

    return entry.result as T;
  }
}
