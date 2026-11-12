const { writeFileSync } = require('node:fs');
const { join } = require('node:path');

const { documentFontFaces, documentLogo, documentPagedJs } = require('../dist');

const [output, gotenberg = 'http://localhost:9091'] = process.argv.slice(2);
if (!output) throw new Error('Usage: node make-pdf.cjs <output directory> [gotenberg url]');

// Same page as apps/api/src/modules/docs/shared/infrastructure/services/renderers/common.html.ts, without page number
const css = `
  ${documentFontFaces()}
  :root { --bleu-france: rgb(0 0 145); --rouge-marianne: rgb(225 0 15); }
  @page {
    size: A4 portrait;
    margin: 3cm 3cm 4cm 3cm;
    @bottom-center { content: element(footer); }
    @bottom-right { content: ''; }
  }
  body { font-family: 'Noto Sans', sans-serif; font-size: 16px; }
  header { text-align: center; }
  header svg { width: 2.5cm; }
  main { margin-top: 2rem; }
  footer { position: running(footer); height: 1px; width: 80%; margin: 0 auto; }
  footer .drapeau { height: 100%; width: 100%; display: flex; }
  footer .drapeau::before, footer .drapeau::after { width: 33%; content: ''; height: 100%; display: block; }
  footer .drapeau::before { background: var(--bleu-france); }
  footer .drapeau::after { background: var(--rouge-marianne); margin-left: 33%; }
`;

const html = `<!doctype html>
<html lang="fr">
  <head>
    <script>
      window.status = 'IDLE';
      window.PagedConfig = { after: () => { window.status = 'OK'; } };
    </script>
    <script defer src="paged.polyfill.min.js"></script>
    <style>${css}</style>
  </head>
  <body>
    <header>${documentLogo()}</header>
    <main>
      <footer><div class="drapeau"></div></footer>
      <p>&nbsp;</p>
    </main>
  </body>
</html>`;

async function main() {
  const form = new FormData();
  form.append('files', new File([html], 'index.html', { type: 'text/html' }));
  form.append('files', new File([documentPagedJs()], 'paged.polyfill.min.js', { type: 'text/javascript' }));
  form.append('preferCssPageSize', 'true');
  form.append('printBackground', 'true');
  form.append('waitForExpression', `window.status === 'OK'`);

  const response = await fetch(`${gotenberg}/forms/chromium/convert/html`, { body: form, method: 'POST' });
  if (!response.ok) throw new Error(`${response.status} ${await response.text()}`);

  const path = join(output, 'modele-vierge-csm.pdf');
  writeFileSync(path, Buffer.from(await response.arrayBuffer()));
  console.log(path);
}

main();
