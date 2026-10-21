import { z } from 'zod';

import { type AttributesByTag, sanitizeHtml } from 'src/utils/sanitize-html';

const EDITOR_TAGS: AttributesByTag = new Map(
  ['br', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'ol', 'p', 'strong', 'ul'].map((tag) => [
    tag,
    new Map(),
  ]),
);

/** what the document editors write: their tags without any attribute, the rest unwrapped to its text */
export function sanitizeEditedHtml(html: string): string {
  return sanitizeHtml(html, EDITOR_TAGS);
}

export const editedHtml = z.string().transform(sanitizeEditedHtml);
