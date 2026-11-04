import { unaccent } from '../../utils/unaccent';

type ProtocolRanked = { lastName: string; sort: number };

/** the order in which the official report lists the members */
export function byProtocolOrder(a: ProtocolRanked, b: ProtocolRanked): number {
  return a.sort - b.sort || unaccent(a.lastName).localeCompare(unaccent(b.lastName));
}
