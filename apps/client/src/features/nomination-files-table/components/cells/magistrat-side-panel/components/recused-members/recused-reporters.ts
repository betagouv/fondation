import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

export type MemberPropositions = {
  files: readonly SessionNominationFile[];
  member: SessionNominationFile['reporters'][number];
};

export function propositionLabel({ content }: SessionNominationFile): string {
  return content.posteCible ? `${content.nomMagistrat} (${content.posteCible})` : content.nomMagistrat;
}

export function isNonRecusableOn(file: SessionNominationFile, memberId: string): boolean {
  return file.nonRecusableMembers.some(({ id }) => id === memberId);
}

/** the added members the API refuses to recuse, with the files concerned; a reporter may be a published one, missing from the file reporters */
export function blockedRecusals(
  files: readonly SessionNominationFile[],
  addedMemberIds: readonly string[],
  members: readonly MemberPropositions['member'][],
): MemberPropositions[] {
  return addedMemberIds.flatMap((memberId) => {
    const blocked = files.filter((file) => isNonRecusableOn(file, memberId));
    const member = members.find(({ id }) => id === memberId);

    return member && blocked.length > 0 ? [{ files: blocked, member }] : [];
  });
}

export function isNonAffectableOn(file: SessionNominationFile, memberId: string): boolean {
  return file.nonAffectableMembers.some(({ id }) => id === memberId);
}

/** the added reporters the API refuses to affect, with the files concerned */
export function blockedAffectations(
  files: readonly SessionNominationFile[],
  addedReporterIds: readonly string[],
  members: readonly MemberPropositions['member'][],
): MemberPropositions[] {
  return addedReporterIds.flatMap((memberId) => {
    const blocked = files.filter((file) => isNonAffectableOn(file, memberId));
    const member = members.find(({ id }) => id === memberId);

    return member && blocked.length > 0 ? [{ files: blocked, member }] : [];
  });
}
