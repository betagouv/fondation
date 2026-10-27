import { load } from 'cheerio';
import { z } from 'zod';

import { type AttributeRule, type AttributesByTag, sanitizeHtml } from './sanitize-html';

const anyValue: AttributeRule = () => true;
const color: AttributeRule = (value) =>
  /^color:\s*([a-z]+|#[\da-f]{3,8}|(rgb|hsl)a?\([\d\s.,%/a-z]+\))\s*;?$/i.test(value);
const dimension: AttributeRule = (value) => /^\d+(\.\d+)?$/.test(value);
const integer: AttributeRule = (value) => /^-?\d+$/.test(value);
const listType: AttributeRule = (value) => /^[1aAiI]$/.test(value);
const sectionAnchor: AttributeRule = (value) => /^#[\w-]+$/.test(value);
const sectionId: AttributeRule = (value) => /^[\w-]+$/.test(value);
const webUrl: AttributeRule = (value) => ['http:', 'https:'].includes(URL.parse(value)?.protocol ?? '');
const mailAddress: AttributeRule = (value) => URL.parse(value)?.protocol === 'mailto:';

const preload: AttributeRule = (value) => /^(auto|metadata|none)$/.test(value);

const noAttribute: ReadonlyMap<string, AttributeRule> = new Map();
const titleAttributes: ReadonlyMap<string, AttributeRule> = new Map([['data-id', sectionId]]);
const cellAttributes: ReadonlyMap<string, AttributeRule> = new Map([
  ['colspan', integer],
  ['rowspan', integer],
]);

const ATTRIBUTES_BY_EDITOR_TAG: AttributesByTag = new Map([
  ['a', new Map([['href', (value) => webUrl(value) || mailAddress(value) || sectionAnchor(value)]])],
  ['aside', noAttribute],
  ['em', noAttribute],
  ['h1', titleAttributes],
  ['h2', titleAttributes],
  ['h3', titleAttributes],
  ['hr', noAttribute],
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
  ['table', noAttribute],
  ['tbody', noAttribute],
  ['td', cellAttributes],
  ['th', cellAttributes],
  ['thead', noAttribute],
  ['tr', noAttribute],
  ['u', noAttribute],
  ['ul', noAttribute],
  [
    'video',
    new Map([
      ['controls', anyValue],
      ['data-file-id', anyValue],
      ['data-file-name', anyValue],
      ['preload', preload],
      ['src', webUrl],
    ]),
  ],
]);

export function fileIdsReferencedIn(html: string): Set<string> {
  const $ = load(html, null, false);

  return new Set(
    $('[data-file-id]')
      .map((_, element) => $(element).attr('data-file-id'))
      .get()
      .filter((id): id is string => !!id),
  );
}

/** mirrors the rich text editor: a tag it does not write is unwrapped to its text rather than dropped */
export function sanitizeRichTextHtml(html: string): string {
  return sanitizeHtml(html, ATTRIBUTES_BY_EDITOR_TAG);
}

export const richTextHtml = z.string().transform(sanitizeRichTextHtml);
