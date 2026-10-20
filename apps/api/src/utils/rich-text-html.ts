import { z } from 'zod';

import { type AttributeRule, type AttributesByTag, sanitizeHtml } from './sanitize-html';

const anyValue: AttributeRule = () => true;
const color: AttributeRule = (value) =>
  /^color:\s*([a-z]+|#[\da-f]{3,8}|(rgb|hsl)a?\([\d\s.,%/a-z]+\))\s*;?$/i.test(value);
const dimension: AttributeRule = (value) => /^\d+(\.\d+)?$/.test(value);
const integer: AttributeRule = (value) => /^-?\d+$/.test(value);
const listType: AttributeRule = (value) => /^[1aAiI]$/.test(value);
const webUrl: AttributeRule = (value) => ['http:', 'https:'].includes(URL.parse(value)?.protocol ?? '');

const noAttribute: ReadonlyMap<string, AttributeRule> = new Map();

const ATTRIBUTES_BY_EDITOR_TAG: AttributesByTag = new Map([
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
  return sanitizeHtml(html, ATTRIBUTES_BY_EDITOR_TAG);
}

export const richTextHtml = z.string().transform(sanitizeRichTextHtml);
