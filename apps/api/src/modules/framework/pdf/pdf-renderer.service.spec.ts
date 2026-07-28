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
  });
});
