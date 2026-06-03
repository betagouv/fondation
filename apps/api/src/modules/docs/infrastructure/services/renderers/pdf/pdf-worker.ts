import puppeteer, { Browser, Page } from 'puppeteer';

let browser: Browser | undefined;
async function getBrowser(): Promise<Browser> {
  if (!browser) {
    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    browser.on('disconnected', () => {
      if (browser) browser = undefined;
    });
  }

  return browser;
}

async function withPage<T>(action: (page: Page) => Promise<T>): Promise<T> {
  const b = await getBrowser();
  const page = await b.newPage();
  return action(page).finally(() =>
    page.close().catch(() => {
      /* noop */
    }),
  );
}

async function withTimeout<T>(
  timeMs: number,
  onAbort: (signal: AbortSignal) => unknown,
  action: () => Promise<T>,
): Promise<T> {
  let signal = AbortSignal.timeout(timeMs);
  const abortCallback = () => onAbort(signal);
  signal.addEventListener('abort', abortCallback, { once: true });

  return action().finally(() => {
    signal.removeEventListener('abort', abortCallback);
  });
}

export default async function renderPdf(html: string): Promise<Uint8Array> {
  let content = html.replace(
    '<head>',
    /* html */ `<head>
      <script>window.PagedConfig = { after: () => window.onPageRendered?.() };</script>\n`,
  );

  const { resolve, reject, promise } = Promise.withResolvers<void>();

  return await withPage(async (page) => {
    page.on('pageerror', (e) => reject(new Error(`unknown error`, { cause: e })));
    page.on('error', (e) => reject(new Error(`unknown error`, { cause: e })));

    await page.exposeFunction('onPageRendered', () => {
      console.log('onPageRendered');
      resolve();
    });

    await page.setContent(content, { waitUntil: 'domcontentloaded' });

    return withTimeout(
      5 * 60 * 1_000,
      (signal) => reject(signal.reason),
      async () => {
        await promise;
        return page.pdf({ format: 'A4', printBackground: true });
      },
    );
  });
}
