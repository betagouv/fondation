import { NominationFile } from "shared-models";
import { NominationFileBuilder } from "../../../core-logic/builders/NominationFile.builder";
import {
  NominationFileListItem,
  NominationFileSM,
} from "../../../store/appState";
import { ApiNominationFileGateway } from "./ApiNominationFile.gateway";
import { FakeNominationFileApiClient } from "./FakeNominationFile.client";

describe("Api Nomination File Gateway", () => {
  let nominationFileApiClient: FakeNominationFileApiClient;

  beforeEach(() => {
    nominationFileApiClient = new FakeNominationFileApiClient();
    nominationFileApiClient.addNominationFile(aReport, aRule);
  });

  it("lists a report", async () => {
    expect(
      await new ApiNominationFileGateway(nominationFileApiClient).list(),
    ).toEqual<NominationFileListItem[]>([
      {
        id: aReport.id,
        folderNumber: aReport.folderNumber,
        name: aReport.name,
        reporterName: aReport.reporterName,
        state: aReport.state,
        dueDate: aReport.dueDate,
        formation: aReport.formation,
        transparency: aReport.transparency,
        grade: aReport.grade,
        targettedPosition: aReport.targettedPosition,
        observersCount: aReport.observersCount,
      },
    ]);
  });

  it("retrieves a report", async () => {
    const rules = nominationFileApiClient.nominationFiles[aReport.id]!.rules;

    expect(
      await new ApiNominationFileGateway(
        nominationFileApiClient,
      ).retrieveNominationFile(aReport.id),
    ).toEqual<NominationFileSM>({
      id: aReport.id,
      folderNumber: aReport.folderNumber,
      name: aReport.name,
      biography: aReport.biography,
      dueDate: aReport.dueDate,
      birthDate: aReport.birthDate,
      state: aReport.state,
      formation: aReport.formation,
      transparency: aReport.transparency,
      grade: aReport.grade,
      currentPosition: aReport.currentPosition,
      targettedPosition: aReport.targettedPosition,
      comment: aReport.comment,
      rank: aReport.rank,
      observers: aReport.observers,
      rules: {
        ...rules,
        [aRule.group]: {
          ...rules[aRule.group],
          [aRule.name]: {
            id: aRule.id,
            preValidated: aRule.preValidated,
            validated: aRule.validated,
            comment: aRule.comment,
          },
        },
      },
    });
  });

  it("updates a rule", async () => {
    await new ApiNominationFileGateway(nominationFileApiClient).updateRule(
      aRule.id,
      !aRule.validated,
    );

    const ruleGroupEntry =
      nominationFileApiClient.nominationFiles[aReport.id]!.rules[aRule.group];
    expect(
      (
        ruleGroupEntry as NominationFile.Rules[NominationFile.RuleGroup.MANAGEMENT]
      )[aRule.name],
    ).toEqual<NominationFile.RuleValue>({
      id: aRule.id,
      validated: !aRule.validated,
      preValidated: aRule.preValidated,
      comment: aRule.comment,
    });
  });
});

const aReport = {
  ...new NominationFileBuilder().buildRetrieveVM(),
  ...new NominationFileBuilder().buildListVM(),
};
const aRule = {
  id: "1",
  group: NominationFile.RuleGroup.MANAGEMENT,
  name: NominationFile.ManagementRule.TRANSFER_TIME,
  preValidated: true,
  validated: true,
  comment: "some rule comment",
};
