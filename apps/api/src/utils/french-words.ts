import { unaccent } from './unaccent';

/** a sentence lowers the capital of a label: "Tribunal judiciaire de Grasse" */
export function lowerFirst(label: string): string {
  return label.charAt(0).toLowerCase() + label.slice(1);
}

const elidingInitials = new Set(['a', 'e', 'i', 'o', 'u', 'y', 'h']);
export function requiresElision(word: string): boolean {
  const first = unaccent(word).trim()[0]?.toLowerCase();
  return !!first && elidingInitials.has(first);
}
