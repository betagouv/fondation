import { mock } from 'vitest-mock-extended';

import { GotenbergHttpClient } from './gotenberg-http-client.service';
import { GotenbergPdfRenderer } from './gotenberg-pdf-renderer.service';

describe('GotenbergPdfRenderer', () => {
  describe('isAvailable', () => {
    it('is true when GET /health returns 200', async () => {
      const http = mock<GotenbergHttpClient>({ health: async () => true });
      const renderer = new GotenbergPdfRenderer(http);

      await expect(renderer.isAvailable()).resolves.toBe(true);
    });

    it('is false when GET /health does not returns 200', async () => {
      const http = mock<GotenbergHttpClient>({ health: async () => false });
      const renderer = new GotenbergPdfRenderer(http);

      await expect(renderer.isAvailable()).resolves.toBe(false);
    });
  });

  describe('render', () => {
    it('injects the window.status signal and sends waitForExpression to Gotenberg', async () => {
      const http = mock<GotenbergHttpClient>();
      http.htmlToPdf.mockResolvedValue(Buffer.from(''));

      const renderer = new GotenbergPdfRenderer(http);

      await renderer.render(/* html */ `<html><head></head></html>`);

      const [request] = http.htmlToPdf.mock.lastCall!;

      expect(request.waitForExpression).toBe(`window.status === 'OK'`);

      const html = request['index.html'];
      expect(html).toContain(`window.status = 'IDLE'`);
      expect(html).toContain(`window.status = 'OK'`);
    });
  });
});
