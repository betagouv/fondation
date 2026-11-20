import { unaccent } from '../../../utils/unaccent';

/** the target positions the CSM requires a jurisdiction sheet for, their deputies excluded */
const POSITIONS_REQUIRING_A_SHEET = ['procureur general', 'procureur de la republique'].map(
  (position) => new RegExp(`^${position} (?!\\s*adjoint)`),
);

export function isJurisdictionSheetExpected(targetedPosition: string | null): boolean {
  const position = unaccent(targetedPosition?.trim() ?? '').toLowerCase();

  return POSITIONS_REQUIRING_A_SHEET.some((requiring) => requiring.test(position));
}
