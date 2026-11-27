import { unaccent } from '../../utils/unaccent';

type ProtocolRanked = { firstName: string; id: string; lastName: string; sort: number };

/** the order in which the official report lists the members */
export function byProtocolOrder(a: ProtocolRanked, b: ProtocolRanked): number {
  return (
    a.sort - b.sort ||
    unaccent(a.lastName).localeCompare(unaccent(b.lastName)) ||
    unaccent(a.firstName).localeCompare(unaccent(b.firstName)) ||
    a.id.localeCompare(b.id)
  );
}
