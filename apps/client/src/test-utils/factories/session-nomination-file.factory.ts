import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

export function makeSessionNominationFile(
  overrides: Partial<SessionNominationFile> = {},
): SessionNominationFile {
  return { id: 'nomination-file', ...overrides } as SessionNominationFile;
}

export function makeSessionNominationFiles(ids: readonly string[]): SessionNominationFile[] {
  return ids.map((id) => makeSessionNominationFile({ id }));
}
