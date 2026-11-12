import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

export type MemberPropositions = {
  files: readonly SessionNominationFile[];
  member: SessionNominationFile['reporters'][number];
};

export function propositionLabel({ content }: SessionNominationFile): string {
  return content.posteCible ? `${content.nomMagistrat} (${content.posteCible})` : content.nomMagistrat;
}

export function isRecusedOn(file: SessionNominationFile, memberId: string): boolean {
  return file.recusedMembers.some(({ id }) => id === memberId);
}

function isReporterOf(file: SessionNominationFile, memberId: string): boolean {
  return file.reporters.some(({ id }) => id === memberId);
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

export function affectedRecusedMembers(
  files: readonly SessionNominationFile[],
  addedReporterIds: readonly string[],
): MemberPropositions[] {
  return addedReporterIds.flatMap((memberId) => {
    const recusedOn = files.filter((file) => isRecusedOn(file, memberId) && !isReporterOf(file, memberId));
    const member = recusedOn[0]?.recusedMembers?.find(({ id }) => id === memberId);

    return member ? [{ files: recusedOn, member }] : [];
  });
}
