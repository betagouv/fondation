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
const PAGED_JS =
  '<script defer crossorigin="anonymous" src="https://unpkg.com/pagedjs@0.4.3/dist/paged.polyfill.min.js"></script>';

function document(props: { css: string; main: string; paged?: boolean }): string {
  return /* html */ `
    <!doctype html>
    <html lang="fr">
      <head>
        ${props.paged === false ? '' : PAGED_JS}
        <style>${DOCUMENT_FONT_FACES}${commonCss}${props.css}</style>
      </head>
      <body>
        <header>${csmLogo}</header>
        <main>${props.main}</main>
      </body>
    </html>
  `;
}

export function agendaDocument(props: { paged?: boolean } = {}): string {
  return document({ css: agendaCss, main: agendaMain, paged: props.paged });
}

export function officialReportDocument(props: { paged?: boolean } = {}): string {
  return document({ css: officialReportCss, main: officialReportMain, paged: props.paged });
}

export function presentationNoticeDocument(props: { paged?: boolean } = {}): string {
  return document({ css: presentationNoticeCss, main: presentationNoticeMain, paged: props.paged });
}
