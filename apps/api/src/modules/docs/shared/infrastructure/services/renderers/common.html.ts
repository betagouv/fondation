import { documentFontFaces, documentLogo } from 'documents-assets';

import type { Pretty, UnionToIntersection } from 'src/utils/types';

import { Template, TemplateFunction } from './templates.types';

export function commonDocumentCss(): string {
  return /*css */ `
    ${documentFontFaces()}

    :root {
      --bleu-france: rgb(0 0 145);
      --rouge-marianne: rgb(225 0 15);

      --deep-blue: rgb(51 75 111);
      --gray: rgb(153 165 183);
      --gold: rgb(197 171 103);
      --gold-light: rgb(214 188 129);
    }

    @page {
      size: A4 portrait;
      margin: 3cm 3cm 4cm 3cm;

      @bottom-center {
        content: element(footer);
      }

      @bottom-right {
        font-size: 0.8rem;
        font-weight: bold;
        content: counter(page);
      }
    }

    body {
      font-family: 'Noto Sans', sans-serif;
      font-size: 16px;
    }

    header {
      text-align: center;
      svg {
        width: 2.5cm;
      }
    }

    main {
      margin-top: 2rem;

      p {
        font-size: 0.8rem;
      }

      .header {
        text-align: center;
        .formation {
          margin: 0;
          padding: 0;
          font-style: italic;
          font-size: 0.8rem;
          text-align: center;
        }

        h1 {
          font-family: Montserrat, sans-serif;
          text-transform: uppercase;
          font-weight: 900;
          font-size: 1.2rem;
          color: var(--deep-blue);
        }
      }
    }

    footer {
      position: running(footer);
      height: 1px;
      width:80%;
      margin: 0 auto;

      .drapeau {
        height: 100%;
        width: 100%;
        display: flex;

        &::after,
        &::before {
          width: 33%;
          content: '';
          height: 100%;
          display: block;
        }

        &::before {
          background: var(--bleu-france);
        }
        &::after {
          background: var(--rouge-marianne);
          margin-left: 33%;
        }
      }
    }
  `;
}

type LayoutContext = Record<'css' | 'header' | 'content' | 'footer', TemplateFunction<never>>;

type MergedCtx<Fns> = Pretty<
  UnionToIntersection<
    Fns extends TemplateFunction<infer Ctx> ? (Parameters<Fns> extends never[] ? never : Ctx) : never
  >
>;

export function documentLayout<const T extends LayoutContext>(layout: T): Template<MergedCtx<T[keyof T]>> {
  return new Template(function (ctx: MergedCtx<T[keyof T]>) {
    // FIXME: once we refactored all docs.
    const { css, header, content, footer } = layout as Record<
      'css' | 'header' | 'content' | 'footer',
      TemplateFunction<any>
    >;

    return /* html */ `
      <!doctype html>
      <html lang="fr">
        <head>
          <script
            defer
            crossorigin="anonymous"
            integrity="sha384-y6+mefdjvGUaOPOrIMXHgP6Wwpza9G0N1QW1YUteLiwb50olbeI7H909UwZTMuVX"
            src="https://unpkg.com/pagedjs@0.4.3/dist/paged.polyfill.min.js"
          ></script>

          <style>
            ${css(ctx)}
          </style>
        </head>
        <body>
          <header>${documentLogo()}</header>

          <main>
            <div class="header">${header(ctx)}</div>

            <footer>
              <div class="drapeau"></div>
            </footer>

            <div class="content" data-editable-content>${content(ctx)}</div>

            <div class="footer">${footer(ctx)}</div>
          </main>
        </body>
      </html>
    `;
  });
}
