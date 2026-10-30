import csmLogo from 'documents-assets/assets/logo-csm.svg?raw';

import agendaCss from './__fixtures__/agenda.css?raw';
import agendaMain from './__fixtures__/agenda.main.html?raw';
import commonCss from './__fixtures__/common.css?raw';
import { DOCUMENT_FONT_FACES } from './__fixtures__/document-fonts';
import officialReportCss from './__fixtures__/official-report.css?raw';
import officialReportMain from './__fixtures__/official-report.main.html?raw';
import presentationNoticeCss from './__fixtures__/presentation-notice.css?raw';
import presentationNoticeMain from './__fixtures__/presentation-notice.main.html?raw';

/** Captured from the api renderers, never retold: regenerate from their snapshots when they move */
function document(props: { css: string; main: string }): string {
  return /* html */ `
    <!doctype html>
    <html lang="fr">
      <head>
        <style>${DOCUMENT_FONT_FACES}${commonCss}${props.css}</style>
      </head>
      <body>
        <header>${csmLogo}</header>
        <main>${props.main}</main>
      </body>
    </html>
  `;
}

export function agendaDocument(): string {
  return document({ css: agendaCss, main: agendaMain });
}

export function officialReportDocument(): string {
  return document({ css: officialReportCss, main: officialReportMain });
}

export function presentationNoticeDocument(): string {
  return document({ css: presentationNoticeCss, main: presentationNoticeMain });
}
