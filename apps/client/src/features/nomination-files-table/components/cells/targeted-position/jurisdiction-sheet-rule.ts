import { unaccent } from '@/utils/string.utils';

/** the target positions the CSM requires a jurisdiction sheet for, their deputies excluded */
const POSITIONS_REQUIRING_A_SHEET = ['Procureur Général', 'Procureur de la République'].map(
  (position) => new RegExp(`^${normalizePosition(position)} (?!\\s*adjoint)`, 'i'),
);

function normalizePosition(position: string | undefined | null): string {
  const trimmed = position?.trim();
  if (!trimmed) return '';

  return unaccent(trimmed).toLowerCase();
}

export function requiresJurisdictionSheet(targetedPosition: string | undefined | null): boolean {
  const position = normalizePosition(targetedPosition);
  if (!position) return false;

  return POSITIONS_REQUIRING_A_SHEET.some((requiring) => requiring.test(position));
}
