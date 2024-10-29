import { Magistrat, NominationFile, Transparency } from "shared-models";
import { NominationFileListItem } from "../../../store/appState";
import { ApiNominationFileGateway } from "./ApiNominationFile.gateway";
import { FakeNominationFileApiClient } from "./FakeNominationFile.client";
import { FakeNominationFileFromApi } from "./FakeNominationFile.gateway";

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
        name: aReport.name,
        reporterName: aReport.reporterName,
        state: aReport.state,
        dueDate: aReport.dueDate,
        formation: aReport.formation,
        transparency: aReport.transparency,
        grade: aReport.grade,
        targettedPosition: aReport.targettedPosition,
      },
    ]);
  });

  it("retrieves a report", async () => {
    const rules = nominationFileApiClient.nominationFiles[aReport.id]!.rules;

    expect(
      await new ApiNominationFileGateway(
        nominationFileApiClient,
      ).retrieveNominationFile(aReport.id),
    ).toEqual({
      id: aReport.id,
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

const aReport: Omit<FakeNominationFileFromApi, "rules"> = {
  id: "report-id",
  name: "name",
  reporterName: "REPORTER Name",
  biography: "biography",
  dueDate: {
    year: 2030,
    month: 10,
    day: 5,
  },
  birthDate: {
    year: 2030,
    month: 10,
    day: 5,
  },
  state: NominationFile.ReportState.NEW,
  formation: Magistrat.Formation.PARQUET,
  transparency: Transparency.MARCH_2025,
  grade: Magistrat.Grade.I,
  currentPosition: "current position",
  targettedPosition: "targetted position",
  comment: "some comment",
  rank: "some rank",
};
const aRule = {
  id: "1",
  group: NominationFile.RuleGroup.MANAGEMENT,
  name: NominationFile.ManagementRule.TRANSFER_TIME,
  preValidated: true,
  validated: true,
  comment: "some rule comment",
};
