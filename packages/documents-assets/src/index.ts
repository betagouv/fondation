import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const ASSETS = join(__dirname, '..', 'assets');

/** A missing weight is not a fallback: the browser climbs to the next one up */
export const DOCUMENT_FONTS = [
  { family: 'Noto Sans', file: 'NotoSans-Regular.woff2', style: 'normal', weight: 400 },
  { family: 'Noto Sans', file: 'NotoSans-Italic.woff2', style: 'italic', weight: 400 },
  { family: 'Noto Sans', file: 'NotoSans-SemiBold.woff2', style: 'normal', weight: 600 },
  { family: 'Noto Sans', file: 'NotoSans-Bold.woff2', style: 'normal', weight: 700 },
  { family: 'Montserrat', file: 'Montserrat-SemiBold.woff2', style: 'normal', weight: 600 },
  { family: 'Montserrat', file: 'Montserrat-Bold.woff2', style: 'normal', weight: 700 },
  { family: 'Montserrat', file: 'Montserrat-Black.woff2', style: 'normal', weight: 900 },
] as const;

let fontFaces: string | undefined;

export function documentFontFaces(): string {
  fontFaces ??= DOCUMENT_FONTS.map(({ family, file, style, weight }) => {
    const data = readFileSync(join(ASSETS, 'fonts', file)).toString('base64');
    return [
      '@font-face {',
      `  font-family: '${family}';`,
      `  font-style: ${style};`,
      `  font-weight: ${weight};`,
      '  font-display: block;',
      `  src: url(data:font/woff2;base64,${data}) format('woff2');`,
      '}',
    ].join('\n');
  }).join('\n');

  return fontFaces;
}

export function documentLogo(): string {
  return readFileSync(join(ASSETS, 'logo-csm.svg'), 'utf8');
}

let pagedJs: Buffer<ArrayBuffer> | undefined;

export function documentPagedJs(): Buffer<ArrayBuffer> {
  // pagedjs only exports its entry point, lib/index.cjs: the browser bundle is reached from there
  pagedJs ??= readFileSync(join(dirname(require.resolve('pagedjs')), '..', 'dist', 'paged.polyfill.min.js'));

  return pagedJs;
}
