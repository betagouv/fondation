import assert from 'node:assert';

import { unaccent } from './unaccent';

export function toFullTextQuery(input: string): string {
  const trimmed = input.trim();
  assert.ok(trimmed.length > 0);

  return unaccent(trimmed.toLowerCase()).replace(/\s+/g, ' & ') + ':*';
}

/** this works for the {@link import('src/generated/prisma/client').Magistrat.search} column */
export function toMagistratFullTextQuery(input: string): string {
  // we have a special weight defined in the index for the email field
  // see https://www.postgresql.org/docs/current/textsearch-controls.html#TEXTSEARCH-RANKING
  // see prisma/migrations/20260428074329_full_text_search_magistrat/migration.sql
  if (input.includes('@') || input.includes('.')) {
    return unaccent(input.trim().toLowerCase()) + ':C*';
  }

  return toFullTextQuery(input);
}
