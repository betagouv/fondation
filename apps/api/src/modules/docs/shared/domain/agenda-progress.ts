export type AgendaFileProgress = {
  /** a reporter in any version of the affectations, published or not */
  hasAnyReporter: boolean;
  hasOutcome: boolean;
  /** a reporter in the published version of the affectations */
  isAffected: boolean;
};

export type AgendaProgress = {
  filesCount: number;
  filesWithoutOutcome: number;
  filesWithoutReporter: number;
  filesWithUnpublishedReporter: number;
  /** an official report can be made of it once every file is decided and affected */
  isReportable: boolean;
};

/** a file taken off its session since the agenda listed it is null: the agenda can no longer be reported */
export function agendaProgressOf(files: readonly (AgendaFileProgress | null)[]): AgendaProgress {
  const listed = files.filter((file) => file !== null);
  const unaffected = listed.filter(({ isAffected }) => !isAffected);

  return {
    filesCount: listed.length,
    filesWithoutOutcome: listed.filter(({ hasOutcome }) => !hasOutcome).length,
    filesWithoutReporter: unaffected.filter(({ hasAnyReporter }) => !hasAnyReporter).length,
    filesWithUnpublishedReporter: unaffected.filter(({ hasAnyReporter }) => hasAnyReporter).length,
    isReportable:
      listed.length === files.length &&
      listed.every(({ hasOutcome, isAffected }) => hasOutcome && isAffected),
  };
}
