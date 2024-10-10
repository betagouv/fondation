import { NominationFileGateway } from "../../../core-logic/gateways/NominationFile.gateway";
import {
  NominationFile,
  NominationFileListItem,
  RuleGroup,
  RuleName,
} from "../../../store/appState";

export class FakeNominationFileGateway implements NominationFileGateway {
  nominationFiles: Record<string, NominationFile> = {};

  async list(): Promise<NominationFileListItem[]> {
    return Object.values(this.nominationFiles).map(
      ({ id, title, dueDate }) => ({
        id,
        title,
        dueDate,
      }),
    );
  }

  async updateRule(
    nominationCaseId: string,
    ruleGroup: RuleGroup,
    ruleName: RuleName,
    validated: boolean,
  ): Promise<void> {
    if (this.nominationFiles[nominationCaseId]) {
      // It looks like Redux makes some nested attributes read-only,
      // so we need to create a new object
      this.nominationFiles[nominationCaseId] = {
        ...this.nominationFiles[nominationCaseId],
        rules: {
          ...this.nominationFiles[nominationCaseId]!.rules,
          [ruleGroup]: {
            ...this.nominationFiles[nominationCaseId]!.rules[ruleGroup],
            [ruleName]: validated,
          },
        },
      };
    }
  }

  async retrieveNominationFile(id: string) {
    const nominationFile = this.nominationFiles[id];
    if (!nominationFile) throw new Error("Nomination case not found");
    return nominationFile;
  }
}
