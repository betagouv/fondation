import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

export type RecusedReporter = {
  files: readonly SessionNominationFile[];
  reporter: SessionNominationFile['reporters'][number];
};

export function propositionLabel({ content }: SessionNominationFile): string {
  return content.posteCible ? `${content.nomMagistrat} (${content.posteCible})` : content.nomMagistrat;
}

export function isRecusedOn(file: SessionNominationFile, memberId: string): boolean {
  return file.recusedMembers.some(({ id }) => id === memberId);
}

export function recusedReporters(
  files: readonly SessionNominationFile[],
  addedMemberIds: readonly string[],
): RecusedReporter[] {
  return addedMemberIds.flatMap((memberId) => {
    const reported = files.filter(
      (file) => file.reporters.some(({ id }) => id === memberId) && !isRecusedOn(file, memberId),
    );
    const reporter = reported[0]?.reporters.find(({ id }) => id === memberId);

    return reporter ? [{ files: reported, reporter }] : [];
  });
}
