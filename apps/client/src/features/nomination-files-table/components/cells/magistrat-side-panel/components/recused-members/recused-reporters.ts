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

export function recusedReporters(
  files: readonly SessionNominationFile[],
  addedMemberIds: readonly string[],
): MemberPropositions[] {
  return addedMemberIds.flatMap((memberId) => {
    const reported = files.filter((file) => isReporterOf(file, memberId) && !isRecusedOn(file, memberId));
    const member = reported[0]?.reporters.find(({ id }) => id === memberId);

    return member ? [{ files: reported, member }] : [];
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
