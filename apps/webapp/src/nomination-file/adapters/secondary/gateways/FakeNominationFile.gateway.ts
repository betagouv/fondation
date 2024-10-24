import { NominationFile } from "shared-models";
import { NominationFileGateway } from "../../../core-logic/gateways/NominationFile.gateway";
import {
  NominationFileListItem,
  NominationFileSM,
} from "../../../store/appState";

export class FakeNominationFileGateway implements NominationFileGateway {
  private nominationFiles: Record<string, NominationFileSM> = {};
  private lastNominationFileId: string | null = null;

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

  async updateNominationFile(
    reportId: string,
    data: Partial<Pick<NominationFileSM, "biography" | "comment">>,
  ): Promise<void> {
    if (this.nominationFiles[reportId])
      this.nominationFiles[reportId] = {
        ...this.nominationFiles[reportId],
        ...data,
      };
  }
  async updateRule(ruleId: string, validated: boolean): Promise<void> {
    if (!this.lastNominationFileId)
      throw new Error(
        "You should set the nomination id for the fake to do the update",
      );
    if (this.nominationFiles[this.lastNominationFileId]) {
      Object.entries(
        this.nominationFiles[this.lastNominationFileId]!.rules,
      ).forEach(([ruleGroup, ruleEntry]) => {
        Object.entries(ruleEntry).forEach(([ruleName, rule]) => {
          if (rule.id === ruleId) {
            const nominationFile =
              this.nominationFiles[this.lastNominationFileId!]!;
            // It looks like Redux makes some nested attributes read-only,
            // so we need to create a new object
            this.nominationFiles[this.lastNominationFileId!] = {
              ...nominationFile,
              rules: {
                ...nominationFile.rules,
                [ruleGroup]: {
                  ...nominationFile.rules[
                    ruleGroup as NominationFile.RuleGroup
                  ],
                  [ruleName]: {
                    ...(
                      nominationFile.rules[
                        ruleGroup as NominationFile.RuleGroup
                      ] as Record<
                        NominationFile.RuleName,
                        NominationFile.RuleValue
                      >
                    )[ruleName as NominationFile.RuleName],
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
    this.lastNominationFileId = aNomination.id;
  }
}
