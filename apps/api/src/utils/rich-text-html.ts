import { load } from 'cheerio';
import { z } from 'zod';

type AttributeRule = (value: string) => boolean;

const anyValue: AttributeRule = () => true;
const color: AttributeRule = (value) => /^color:\s*(#[\da-f]{3,8}|rgba?\([\d\s.,%]+\))\s*;?$/i.test(value);
const dimension: AttributeRule = (value) => /^\d+(\.\d+)?$/.test(value);
const integer: AttributeRule = (value) => /^-?\d+$/.test(value);
const listType: AttributeRule = (value) => /^[1aAiI]$/.test(value);
const webUrl: AttributeRule = (value) => ['http:', 'https:'].includes(URL.parse(value)?.protocol ?? '');

const noAttribute: ReadonlyMap<string, AttributeRule> = new Map();

const ATTRIBUTES_BY_EDITOR_TAG: ReadonlyMap<string, ReadonlyMap<string, AttributeRule>> = new Map([
  ['em', noAttribute],
  ['h1', noAttribute],
  ['h2', noAttribute],
  ['h3', noAttribute],
  [
    'img',
    new Map([
      ['alt', anyValue],
      ['data-file-id', anyValue],
      ['data-file-name', anyValue],
      ['height', dimension],
      ['src', webUrl],
      ['title', anyValue],
      ['width', dimension],
    ]),
  ],
  ['li', noAttribute],
  ['mark', noAttribute],
  [
    'ol',
    new Map([
      ['start', integer],
      ['type', listType],
    ]),
  ],
  ['p', noAttribute],
  ['span', new Map([['style', color]])],
  ['strong', noAttribute],
  ['u', noAttribute],
  ['ul', noAttribute],
]);

/** mirrors the rich text editor: a tag it does not write is unwrapped to its text rather than dropped */
export function sanitizeRichTextHtml(html: string): string {
  const $ = load(html, null, false);

  $('iframe, noscript, script, style, template, textarea, title').remove();
  $('*').each((_, element) => {
    if (!('attribs' in element)) return;

    const rules = ATTRIBUTES_BY_EDITOR_TAG.get(element.name);
    if (!rules) $(element).replaceWith($(element).contents());
    else
      element.attribs = Object.fromEntries(
        Object.entries(element.attribs).filter(([name, value]) => rules.get(name)?.(value)),
      );
  });
  $.root()
    .find('*')
    .addBack()
    .contents()
    .filter((_, node) => node.type === 'comment')
    .remove();

  return $.html();
}

export const richTextHtml = z.string().transform(sanitizeRichTextHtml);
