import { HttpService } from '@nestjs/axios';
import { ServiceUnavailableException } from '@nestjs/common';
import { AxiosError } from 'axios';
import { of, throwError } from 'rxjs';
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

    it('should keep the path prefix of the base url', async () => {
      const http = mock<HttpService>();
      http.post.mockReturnValue(of({ data: new ArrayBuffer(0) } as any));

      const client = new GotenbergHttpClient(http, new URL('https://proxy.dev/gotenberg'));
      await client.htmlToPdf({ 'index.html': '<html></html>' });

      const [url] = http.post.mock.lastCall! as [string];
      expect(url).toBe('https://proxy.dev/gotenberg/forms/chromium/convert/html');
    });

    it('should report the gotenberg failure as unavailable', async () => {
      const http = mock<HttpService>();
      http.post.mockReturnValue(
        throwError(
          () =>
            new AxiosError('Request failed with status code 409', 'ERR_BAD_REQUEST', undefined, undefined, {
              status: 409,
              data: Buffer.from('waiting for expression timed out'),
            } as any),
        ),
      );

      const client = new GotenbergHttpClient(http, new URL('http://gotenberg.dev'));

      await expect(client.htmlToPdf({ 'index.html': '<html></html>' })).rejects.toThrow(
        ServiceUnavailableException,
      );
    });

    it('should report a connection failure, which carries no response', async () => {
      const http = mock<HttpService>();
      http.post.mockReturnValue(
        throwError(() => new AxiosError('connect ECONNREFUSED 10.240.0.2:80', 'ECONNREFUSED')),
      );

      const client = new GotenbergHttpClient(http, new URL('http://gotenberg.dev'));

      await expect(client.htmlToPdf({ 'index.html': '<html></html>' })).rejects.toThrow(
        ServiceUnavailableException,
      );
    });

    it('should let a non-axios failure through untouched', async () => {
      const http = mock<HttpService>();
      const boom = new Error('boom');
      http.post.mockReturnValue(throwError(() => boom));

      const client = new GotenbergHttpClient(http, new URL('http://gotenberg.dev'));

      await expect(client.htmlToPdf({ 'index.html': '<html></html>' })).rejects.toBe(boom);
    });
  });
});
