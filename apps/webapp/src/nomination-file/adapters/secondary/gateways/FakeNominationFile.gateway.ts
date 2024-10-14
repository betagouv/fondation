import { NominationFile } from "@/shared-models";
import { NominationFileGateway } from "../../../core-logic/gateways/NominationFile.gateway";
import {
  NominationFileListItem,
  NominationFileSM,
} from "../../../store/appState";

export class FakeNominationFileGateway implements NominationFileGateway {
  nominationFiles: Record<string, NominationFileSM> = {};
  currentNominationFileId: string | null = null;

  async list(): Promise<NominationFileListItem[]> {
    return Object.values(this.nominationFiles).map(
      ({
        id,
        name,
        dueDate,
        state,
        formation,
        transparency,
        grade,
        targettedPosition,
      }) => ({
        id,
        name,
        dueDate,
        state,
        formation,
        transparency,
        grade,
        targettedPosition,
      }),
    );
  }

  async updateRule(ruleId: string, validated: boolean): Promise<void> {
    if (!this.currentNominationFileId)
      throw new Error(
        "You should set the nomination id for the fake to do the update",
      );
    if (this.nominationFiles[this.currentNominationFileId]) {
      Object.entries(
        this.nominationFiles[this.currentNominationFileId]!.rules,
      ).forEach(([ruleGroup, ruleEntry]) => {
        Object.entries(ruleEntry).forEach(([ruleName, rule]) => {
          console.log(
            " ruleId",
            rule.id,
            ruleId,
            ruleGroup,
            ruleName,
            validated,
          );
          if (rule.id === ruleId) {
            const nominationFile =
              this.nominationFiles[this.currentNominationFileId!]!;
            // It looks like Redux makes some nested attributes read-only,
            // so we need to create a new object
            this.nominationFiles[this.currentNominationFileId!] = {
              ...nominationFile,
              rules: {
                ...nominationFile.rules,
                [ruleGroup]: {
                  ...nominationFile.rules[
                    ruleGroup as NominationFile.RuleGroup.MANAGEMENT
                  ],
                  [ruleName]: {
                    ...nominationFile.rules[
                      ruleGroup as NominationFile.RuleGroup.MANAGEMENT
                    ][ruleName as NominationFile.RuleName],
                    validated,
                  },
                },
              },
            };
          }
        });
      });
    }
  }

  async retrieveNominationFile(id: string) {
    const nominationFile = this.nominationFiles[id];
    if (!nominationFile) throw new Error("Nomination case not found");
    return nominationFile;
  }

  addNominationFile(aNomination: NominationFileSM) {
    this.nominationFiles[aNomination.id] = aNomination;
    this.currentNominationFileId = aNomination.id;
  }
}
