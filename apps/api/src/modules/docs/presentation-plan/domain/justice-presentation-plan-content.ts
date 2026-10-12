import { DocNominationFileOutcomeEnum } from 'src/modules/docs/shared/domain/doc-nomination-file-outcome';

/** what the notice puts in front of its reader, and only that: the rest it copies is never rendered */
export type JusticePresentationPlanFile = {
  name: string;
  nominationFileId: string;
  number: number;
  outcome: DocNominationFileOutcomeEnum;
  outcomeComment: string | null;
  targetedGrade: string;
  targetedPosition: string | null;
};

export class JusticePresentationPlanContent {
  private constructor(private readonly files: ReadonlyMap<string, JusticePresentationPlanFile>) {}

  static from(files: readonly JusticePresentationPlanFile[]): JusticePresentationPlanContent {
    return new JusticePresentationPlanContent(new Map(files.map((file) => [file.nominationFileId, file])));
  }

  differsFrom(other: JusticePresentationPlanContent): boolean {
    if (this.files.size !== other.files.size) return true;

    for (const [nominationFileId, file] of this.files) {
      const theirs = other.files.get(nominationFileId);
      if (!theirs) return true;

      if (
        file.name !== theirs.name ||
        file.number !== theirs.number ||
        file.outcome !== theirs.outcome ||
        file.outcomeComment !== theirs.outcomeComment ||
        file.targetedGrade !== theirs.targetedGrade ||
        file.targetedPosition !== theirs.targetedPosition
      ) {
        return true;
      }
    }

    return false;
  }
}
