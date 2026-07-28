import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export class GotenbergHttpClient {
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

    const url = new URL(this.urls.htmlToPdf, this.baseUrl).toString();
    const response = await firstValueFrom(
      this.http.post<ArrayBuffer>(url, form, { timeout: request.timeout, responseType: 'arraybuffer' }),
    );

    return Buffer.from(response.data);
  }
}
