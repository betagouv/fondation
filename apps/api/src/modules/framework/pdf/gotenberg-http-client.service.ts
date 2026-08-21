import { HttpService } from '@nestjs/axios';
import { Logger, ServiceUnavailableException } from '@nestjs/common';
import { isAxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';

function readErrorBody(data: unknown): string {
  if (data == null) return '';
  if (Buffer.isBuffer(data)) return data.toString('utf8').trim().slice(0, 500);
  if (data instanceof ArrayBuffer) return Buffer.from(data).toString('utf8').trim().slice(0, 500);

  return (typeof data === 'string' ? data : JSON.stringify(data)).trim().slice(0, 500);
}

export class GotenbergHttpClient {
  private readonly logger = new Logger(GotenbergHttpClient.name);
  private readonly urls = {
    htmlToPdf: `/forms/chromium/convert/html`,
  };

  constructor(
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

    const url = this.endpoint(this.urls.htmlToPdf);
    const response = await firstValueFrom(
      this.http.post<ArrayBuffer>(url, form, { timeout: request.timeout, responseType: 'arraybuffer' }),
    ).catch((error: unknown) => this.rethrow(url, error));

    return Buffer.from(response.data);
  }

  private endpoint(path: string): string {
    return new URL(this.baseUrl.pathname.replace(/\/$/, '') + path, this.baseUrl).toString();
  }

  private rethrow(url: string, error: unknown): never {
    if (!isAxiosError(error)) throw error;

    const { status, data } = error.response ?? {};
    this.logger.error(`POST ${url} - ${status ?? error.code ?? error.message} ${readErrorBody(data)}`);
    throw new ServiceUnavailableException('PDF_RENDERER_UNAVAILABLE', { cause: error });
  }
}
