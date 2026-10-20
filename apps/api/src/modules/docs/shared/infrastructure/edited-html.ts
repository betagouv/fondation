import { load } from 'cheerio';
import { z } from 'zod';

const EDITOR_TAGS = new Set([
  'br',
  'em',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'li',
  'ol',
  'p',
  'strong',
  'ul',
]);

/** what the document editors write: their tags without any attribute, the rest unwrapped to its text */
export function sanitizeEditedHtml(html: string): string {
  const $ = load(html, null, false);

  $('iframe, noscript, script, style, template, textarea, title').remove();
  $('*').each((_, element) => {
    if (!('attribs' in element)) return;
    if (EDITOR_TAGS.has(element.name)) element.attribs = {};
    else $(element).replaceWith($(element).contents());
  });
  $.root()
    .find('*')
    .addBack()
    .contents()
    .filter((_, node) => node.type === 'comment')
    .remove();

  return $.html();
}

export const editedHtml = z.string().transform(sanitizeEditedHtml);
