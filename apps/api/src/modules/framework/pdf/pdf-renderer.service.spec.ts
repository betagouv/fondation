import { createHash } from 'node:crypto';

import { load } from 'cheerio';
import { documentPagedJs } from 'documents-assets';
import { mock } from 'vitest-mock-extended';

import { GotenbergHttpClient } from './gotenberg-http-client.service';
import { PdfRenderer } from './pdf-renderer.service';

describe('PdfRenderer', () => {
  describe('render', () => {
    it('injects the window.status signal and sends waitForExpression to Gotenberg', async () => {
      const http = mock<GotenbergHttpClient>();
      http.htmlToPdf.mockResolvedValue(Buffer.from(''));

      const renderer = new PdfRenderer(http);

      await renderer.render(/* html */ `<html><head></head></html>`);

      const [request] = http.htmlToPdf.mock.lastCall!;

      expect(request.waitForExpression).toBe(`window.status === 'OK'`);

      const html = request['index.html'];
      expect(html).toContain(`window.status = 'IDLE'`);
      expect(html).toContain(`window.status = 'OK'`);
    });

    it('loads paged.js from the file sent to Gotenberg, even for a document frozen with the unpkg one', async () => {
      const http = mock<GotenbergHttpClient>();
      http.htmlToPdf.mockResolvedValue(Buffer.from(''));

      const renderer = new PdfRenderer(http);

      await renderer.render(/* html */ `<html><head>
        <script
          defer
          crossorigin="anonymous"
          integrity="sha384-y6+mefdjvGUaOPOrIMXHgP6Wwpza9G0N1QW1YUteLiwb50olbeI7H909UwZTMuVX"
          src="https://unpkg.com/pagedjs@0.4.3/dist/paged.polyfill.min.js"
        ></script>
      </head></html>`);

      const [request] = http.htmlToPdf.mock.lastCall!;
      const scripts = load(request['index.html'])('script[src*="paged"]');

      expect(scripts.toArray().map(({ attribs }) => attribs)).toEqual([
        { defer: '', src: 'paged.polyfill.min.js' },
      ]);
      expect(request.files?.map(({ name }) => name)).toEqual(['paged.polyfill.min.js']);
    });
  });

  it('lays the official documents out with the very paged.js build they were checked against', () => {
    const digest = createHash('sha384').update(documentPagedJs()).digest('base64');

    expect(digest).toBe('y6+mefdjvGUaOPOrIMXHgP6Wwpza9G0N1QW1YUteLiwb50olbeI7H909UwZTMuVX');
  });
});
