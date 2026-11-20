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

export function isNonAffectableOn(file: SessionNominationFile, memberId: string): boolean {
  return file.nonAffectableMembers.some(({ id }) => id === memberId);
}

/**
 * the added members the API refuses, with the files concerned, by isNonRecusableOn or isNonAffectableOn;
 * a non-recusable reporter may be a published one, missing from the file reporters
 */
export function blockedMembers(
  files: readonly SessionNominationFile[],
  addedMemberIds: readonly string[],
  members: readonly MemberPropositions['member'][],
  isBlockedOn: (file: SessionNominationFile, memberId: string) => boolean,
): MemberPropositions[] {
  return addedMemberIds.flatMap((memberId) => {
    const blocked = files.filter((file) => isBlockedOn(file, memberId));
    const member = members.find(({ id }) => id === memberId);

    return member && blocked.length > 0 ? [{ files: blocked, member }] : [];
  });
}
