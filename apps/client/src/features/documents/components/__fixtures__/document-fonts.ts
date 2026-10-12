import montserratBlack from 'documents-assets/assets/fonts/Montserrat-Black.woff2?url';
import montserratBold from 'documents-assets/assets/fonts/Montserrat-Bold.woff2?url';
import montserratSemiBold from 'documents-assets/assets/fonts/Montserrat-SemiBold.woff2?url';
import notoSansBold from 'documents-assets/assets/fonts/NotoSans-Bold.woff2?url';
import notoSansItalic from 'documents-assets/assets/fonts/NotoSans-Italic.woff2?url';
import notoSansRegular from 'documents-assets/assets/fonts/NotoSans-Regular.woff2?url';
import notoSansSemiBold from 'documents-assets/assets/fonts/NotoSans-SemiBold.woff2?url';

const FACES = [
  { family: 'Noto Sans', style: 'normal', url: notoSansRegular, weight: 400 },
  { family: 'Noto Sans', style: 'italic', url: notoSansItalic, weight: 400 },
  { family: 'Noto Sans', style: 'normal', url: notoSansSemiBold, weight: 600 },
  { family: 'Noto Sans', style: 'normal', url: notoSansBold, weight: 700 },
  { family: 'Montserrat', style: 'normal', url: montserratSemiBold, weight: 600 },
  { family: 'Montserrat', style: 'normal', url: montserratBold, weight: 700 },
  { family: 'Montserrat', style: 'normal', url: montserratBlack, weight: 900 },
];

export const DOCUMENT_FONT_FACES = FACES.map(
  ({ family, style, url, weight }) => `@font-face {
  font-family: '${family}';
  font-style: ${style};
  font-weight: ${weight};
  font-display: block;
  src: url(${new URL(url, window.location.origin).href}) format('woff2');
}`,
).join('\n');
