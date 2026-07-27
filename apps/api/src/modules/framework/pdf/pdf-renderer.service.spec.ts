import { mock } from 'vitest-mock-extended';

import { GotenbergPdfRenderer } from './gotenberg-pdf-renderer.service';
import { PdfRenderer } from './pdf-renderer.service';
import { PuppeteerPdfRenderer } from './puppeteer-pdf-renderer.service';

describe('PdfRenderer', () => {
  it('renders with Gotenberg when it is available', async () => {
    const gotenberg = mock<GotenbergPdfRenderer>();
    gotenberg.isAvailable.mockResolvedValue(true);
    gotenberg.render.calledWith('<html></html>').mockResolvedValueOnce(Buffer.from(''));

    const puppeteer = mock<PuppeteerPdfRenderer>();

    const renderer = new PdfRenderer(gotenberg, puppeteer);

    await expect(renderer.render('<html></html>')).resolves.toEqual(expect.any(Buffer));

    // oxlint-disable-next-line typescript/unbound-method
    expect(puppeteer.render).not.toHaveBeenCalled();
  });

  it('falls back to Puppeteer when Gotenberg is unavailable', async () => {
    const gotenberg = mock<GotenbergPdfRenderer>({ isAvailable: async () => false });
    const puppeteer = mock<PuppeteerPdfRenderer>();
    puppeteer.render.calledWith('<html></html>').mockResolvedValueOnce(Buffer.from(''));

    const renderer = new PdfRenderer(gotenberg, puppeteer);

    await expect(renderer.render('<html></html>')).resolves.toEqual(expect.any(Buffer));

    // oxlint-disable-next-line typescript/unbound-method
    expect(gotenberg.render).not.toHaveBeenCalled();
  });
});
