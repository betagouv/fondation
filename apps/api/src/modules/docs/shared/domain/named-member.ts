/** a member as a document names them: `id` is null when a name written before the ids were kept matched no single member */
export type NamedMember = { id: string | null; name: string };

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
