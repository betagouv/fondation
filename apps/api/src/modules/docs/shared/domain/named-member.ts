/** a member as a document names them: `id` is null when a name written before the ids were kept matched no single member */
export type NamedMember = { id: string | null; name: string };

/** how the members are printed today, by id: a recused member's name carries the title of their recusal */
export type CurrentNames = {
  recusedMembers: ReadonlyMap<string, string>;
  reporters: ReadonlyMap<string, string>;
};

export const NO_CURRENT_NAMES: CurrentNames = { recusedMembers: new Map(), reporters: new Map() };

/** the same members under the names they bear today: one no longer found keeps the name it was stored with */
export function namedToday(
  members: readonly NamedMember[],
  names: ReadonlyMap<string, string>,
): NamedMember[] {
  return members.map((member) => ({
    ...member,
    name: member.id === null ? member.name : (names.get(member.id) ?? member.name),
  }));
}

/** who the members are, however they are named: a member stored without id is known by name */
export function sameMembers(current: readonly NamedMember[], next: readonly NamedMember[]): boolean {
  return (
    current.length === next.length &&
    current.every((member) =>
      next.some((other) => (member.id === null ? other.name === member.name : other.id === member.id)),
    )
  );
}

/** how the members are named, in the order they are printed */
export function sameNames(current: readonly NamedMember[], next: readonly NamedMember[]): boolean {
  return current.length === next.length && current.every(({ name }, i) => next[i]?.name === name);
}
