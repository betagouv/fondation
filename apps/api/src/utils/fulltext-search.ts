import { unaccent } from './unaccent';

// Only letters and digits reach to_tsquery, whose operators (& | ! : < ( ') would fail the query: "d'artagnan" looks for "d" and "artagnan"
function wordsOf(input: string): string[] {
  return unaccent(input.toLowerCase()).match(/[\p{L}\p{N}]+/gu) ?? [];
}

/** an input without any letter or digit gives an empty query, which matches nothing */
export function toFullTextQuery(input: string): string {
  const words = wordsOf(input);
  return words.length > 0 ? `${words.join(' & ')}:*` : '';
}

/**
 * this works for the {@link import('src/generated/prisma/client').Magistrat.search} column
 * an input without any letter or digit gives an empty query, which matches nothing
 */
export function toMagistratFullTextQuery(input: string): string {
  // we have a special weight defined in the index for the email field
  // see https://www.postgresql.org/docs/current/textsearch-controls.html#TEXTSEARCH-RANKING
  // see prisma/migrations/20260428074329_full_text_search_magistrat/migration.sql
  if (input.includes('@') || input.includes('.')) {
    const email = unaccent(input.toLowerCase()).replace(/[^\p{L}\p{N}.@_-]/gu, '');
    return email && `${email}:C*`;
  }

  return wordsOf(input)
    .map((word) => `${word}:*`)
    .join(' & ');
}
