import puppeteer, { Browser } from 'puppeteer';

let browser: Browser | undefined;

async function getBrowser(): Promise<Browser> {
  if (!browser) {
    browser = await puppeteer.launch({
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
    });
  }
  return browser;
}

export default async function renderPdf(html: string): Promise<Buffer> {
  const b = await getBrowser();
  const page = await b.newPage();
  try {
    await page.setContent(html, { waitUntil: 'networkidle0' });
    return Buffer.from(
      await page.pdf({
        format: 'A4',
        printBackground: true,
      }),
    );
  } finally {
    await page.close();
  }
}
