import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { mock } from 'vitest-mock-extended';

import { GotenbergHttpClient } from './gotenberg-http-client.service';

describe('GotenbergHttpClient', () => {
  describe('health', () => {
    it('should call the health endpoint', async () => {
      const http = mock<HttpService>();
      http.get
        .calledWith('http://gotenberg.dev/health', expect.anything())
        .mockReturnValue(of({ status: 200 } as any));

      const client = new GotenbergHttpClient(
        mock({ now: () => new Date() }),
        http,
        new URL('http://gotenberg.dev'),
      );

      const isAvailable = await client.health();
      expect(isAvailable).toBe(true);
    });

    it('should cache the call', async () => {
      const http = mock<HttpService>();
      http.get
        .calledWith('http://gotenberg.dev/health', expect.anything())
        .mockReturnValueOnce(of({ status: 200 } as any));

      const client = new GotenbergHttpClient(
        mock({ now: () => new Date() }),
        http,
        new URL('http://gotenberg.dev'),
      );

      const isAvailable = await client.health({ ttl: 30_000 });
      expect(isAvailable).toBe(true);

      const isCachedAvailable = await client.health({ ttl: 30_000 });
      expect(isCachedAvailable).toBe(true);

      // oxlint-disable-next-line typescript/unbound-method
      expect(http.get).toHaveBeenCalledOnce();
    });

    it('should return false on failing status', async () => {
      const http = mock<HttpService>();
      http.get
        .calledWith('http://gotenberg.dev/health', expect.anything())
        .mockReturnValue(throwError(() => new Error('unknown error')));

      const client = new GotenbergHttpClient(
        mock({ now: () => new Date() }),
        http,
        new URL('http://gotenberg.dev'),
      );

      const isAvailable = await client.health({ ttl: 30_000 });
      expect(isAvailable).toBe(false);
    });

    it('should return false on throw', async () => {
      const http = mock<HttpService>();
      http.get
        .calledWith('http://gotenberg.dev/health', expect.anything())
        .mockThrow(new Error('unknown error'));

      const client = new GotenbergHttpClient(
        mock({ now: () => new Date() }),
        http,
        new URL('http://gotenberg.dev'),
      );

      const isAvailable = await client.health({ ttl: 30_000 });
      expect(isAvailable).toBe(false);
    });
  });

  describe('htmlToPdf', () => {
    it('should call the html to pdf endpoint', async () => {
      const http = mock<HttpService>();
      http.post
        .calledWith('http://gotenberg.dev/forms/chromium/convert/html', expect.any(FormData))
        .mockReturnValue(of({ data: new ArrayBuffer(0) } as any));

      const client = new GotenbergHttpClient(mock(), http, new URL('http://gotenberg.dev'));

      await expect(client.htmlToPdf({ 'index.html': '<html></html>' })).resolves.toEqual(expect.any(Buffer));
    });

    it('should convert options to form', async () => {
      const http = mock<HttpService>();
      http.post
        .calledWith('http://gotenberg.dev/forms/chromium/convert/html', expect.any(FormData))
        .mockReturnValue(of({ data: new ArrayBuffer(0) } as any));

      const client = new GotenbergHttpClient(mock(), http, new URL('http://gotenberg.dev'));

      await client.htmlToPdf({ printBackground: false, 'index.html': '<html></html>' });

      const [_, formData] = http.post.mock.lastCall! as [unknown, FormData | undefined];
      expect(formData?.get('printBackground')).toBe('false');
    });
  });
});
