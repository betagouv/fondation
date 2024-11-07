import {
  Magistrat,
  NominationFile,
  ReportListItemVM,
  ReportRetrievalVM,
  Transparency,
} from "shared-models";
import {
  NominationFileGateway,
  UpdateNominationFileParams,
} from "../../../core-logic/gateways/NominationFile.gateway";
import {
  NominationFileListItem,
  NominationFileSM,
} from "../../../store/appState";

export type FakeNominationFileFromApi = ReportRetrievalVM | ReportListItemVM;

export class FakeNominationFileGateway implements NominationFileGateway {
  private nominationFiles: Record<string, FakeNominationFileFromApi> = {};
  private lastNominationFileId: string | null = null;

  async list(): Promise<NominationFileListItem[]> {
    return (Object.values(this.nominationFiles) as ReportListItemVM[]).map(
      ({
        id,
        name,
        reporterName,
        dueDate,
        state,
        formation,
        transparency,
        grade,
        targettedPosition,
        observersCount,
      }) => ({
        id,
        name,
        reporterName,
        dueDate,
        state,
        formation,
        transparency,
        grade,
        targettedPosition,
        observersCount,
      }),
    );
  }

  async updateNominationFile(
    reportId: string,
    data: UpdateNominationFileParams,
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
    const nominationFile = this.nominationFiles[this.lastNominationFileId];

    if (nominationFile) {
      if (!("comment" in nominationFile))
        throw new Error("Fake nomination file should be a of type retrieval");

      Object.entries(nominationFile.rules).forEach(([ruleGroup, ruleEntry]) => {
        Object.entries(ruleEntry).forEach(([ruleName, rule]) => {
          if (rule.id === ruleId) {
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

  async retrieveNominationFile(id: string): Promise<NominationFileSM | null> {
    const nominationFile = this.nominationFiles[id];
    if (!nominationFile) throw new Error("Nomination case not found");
    if (!("comment" in nominationFile))
      throw new Error("Fake nomination file should be a of type retrieval");

    return {
      id: nominationFile.id,
      name: nominationFile.name,
      biography: nominationFile.biography,
      dueDate: nominationFile.dueDate,
      birthDate: nominationFile.birthDate,
      state: nominationFile.state as NominationFile.ReportState,
      formation: nominationFile.formation as Magistrat.Formation,
      transparency: nominationFile.transparency as Transparency,
      grade: nominationFile.grade as Magistrat.Grade,
      currentPosition: nominationFile.currentPosition,
      targettedPosition: nominationFile.targettedPosition,
      comment: nominationFile.comment,
      rank: nominationFile.rank,
      observers: nominationFile.observers,
      rules: nominationFile.rules,
    };
  }

  addNominationFile(aNomination: FakeNominationFileFromApi) {
    this.nominationFiles[aNomination.id] = aNomination;
    this.lastNominationFileId = aNomination.id;
  }
}
