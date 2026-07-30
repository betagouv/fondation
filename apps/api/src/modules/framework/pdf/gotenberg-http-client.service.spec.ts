import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { mock } from 'vitest-mock-extended';

import { GotenbergHttpClient } from './gotenberg-http-client.service';

describe('GotenbergHttpClient', () => {
  describe('htmlToPdf', () => {
    it('should call the html to pdf endpoint', async () => {
      const http = mock<HttpService>();
      http.post
        .calledWith('http://gotenberg.dev/forms/chromium/convert/html', expect.any(FormData))
        .mockReturnValue(of({ data: new ArrayBuffer(0) } as any));

      const client = new GotenbergHttpClient(http, new URL('http://gotenberg.dev'));

      await expect(client.htmlToPdf({ 'index.html': '<html></html>' })).resolves.toEqual(expect.any(Buffer));
    });

    it('should convert options to form', async () => {
      const http = mock<HttpService>();
      http.post
        .calledWith('http://gotenberg.dev/forms/chromium/convert/html', expect.any(FormData))
        .mockReturnValue(of({ data: new ArrayBuffer(0) } as any));

      const client = new GotenbergHttpClient(http, new URL('http://gotenberg.dev'));

      await client.htmlToPdf({ printBackground: false, 'index.html': '<html></html>' });

      const [_, formData] = http.post.mock.lastCall! as [unknown, FormData | undefined];
      expect(formData?.get('printBackground')).toBe('false');
    });
  });
});
