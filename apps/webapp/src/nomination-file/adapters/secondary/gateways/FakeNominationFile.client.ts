import {
  NominationFile,
  ReportListingVM,
  ReportRetrievalVM,
  rulesTuple,
} from "@/shared-models";
import { NominationFileApiClient } from "../../../core-logic/gateways/NominationFileApi.client";
import { ReportUpdateDto } from "@/api-sdk/generated/structures/ReportUpdateDto";

export class FakeNominationFileApiClient implements NominationFileApiClient {
  nominationFiles: Record<string, ReportRetrievalVM> = {};
  currentNominationFileId: string | null = null;
  currentRuleGroup: NominationFile.RuleGroup | null = null;
  currentRuleName: NominationFile.RuleName | null = null;

  addNominationFile(
    nominationFile: Omit<ReportRetrievalVM, "rules">,
    rule: {
      id: string;
      group: NominationFile.RuleGroup;
      name: NominationFile.RuleName;
      preValidated: boolean;
      validated: boolean;
      comment: string | null;
    },
  ): void {
    this.currentNominationFileId = nominationFile.id;
    this.currentRuleGroup = rule.group;
    this.currentRuleName = rule.name;

    this.nominationFiles[nominationFile.id] = {
      ...nominationFile,
      rules: getAllRulesPreValidated(),
    };
    this.nominationFiles[nominationFile.id]!.rules = this.genRules(
      nominationFile.id,
      {
        id: rule.id,
        preValidated: rule.preValidated,
        validated: rule.validated,
        comment: rule.comment,
      },
    );
  }

  async updateReport(reportId: string, data: ReportUpdateDto): Promise<void> {
    if (this.nominationFiles[reportId])
      this.nominationFiles[reportId] = {
        ...(this.nominationFiles[reportId] || {}),
        ...(data as ReportRetrievalVM),
      };
  }

  async updateRule(ruleId: string, validated: boolean): Promise<void> {
    if (!this.currentNominationFileId)
      throw new Error("No nomination file id in fake client");
    const rule = (
      this.nominationFiles[this.currentNominationFileId]!.rules[
        this.currentRuleGroup!
      ] as Record<NominationFile.RuleName, NominationFile.RuleValue>
    )[this.currentRuleName!] as NominationFile.RuleValue;

    this.nominationFiles[this.currentNominationFileId]!.rules = this.genRules(
      this.currentNominationFileId,
      {
        id: ruleId,
        validated,
        preValidated: rule.preValidated,
        comment: rule.comment,
      },
    );
  }

  async retrieveNominationFile(id: string): Promise<ReportRetrievalVM | null> {
    const report = this.nominationFiles[id];
    return report || null;
  }

  async list(): Promise<ReportListingVM> {
    const reports = Object.values(this.nominationFiles);

    return {
      data: reports,
    };
  }

  private genRules(
    nominationFileId: string,
    rule: {
      id: string;
      preValidated: boolean;
      validated: boolean;
      comment: string | null;
    },
  ): NominationFile.Rules {
    if (!this.currentNominationFileId)
      throw new Error("No nomination file id in fake client");

    if (!this.currentRuleGroup || !this.currentRuleName) {
      throw new Error("No current rule group or name in fake client");
    }

    const nominationFile = this.nominationFiles[nominationFileId];
    if (!nominationFile) throw new Error("No nomination file in fake client");

    return {
      ...nominationFile.rules,
      [this.currentRuleGroup]: {
        ...nominationFile.rules[this.currentRuleGroup],
        [this.currentRuleName]: {
          id: rule.id,
          preValidated: rule.preValidated,
          validated: rule.validated,
          comment: rule.comment,
        },
      },
    };
  }
}

export const getAllRulesPreValidated = (): NominationFile.Rules =>
  rulesTuple.reduce(
    (acc, [group, name]) => {
      return {
        ...acc,
        [group]: {
          ...acc[group],
          [name]: {
            id: "some-id",
            preValidated: true,
            validated: false,
            comment: null,
          },
        },
      };
    },

    {} as NominationFile.Rules,
  );
