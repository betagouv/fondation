import { NominationFile, allRulesTuple } from "shared-models";
import { DateOnly } from "../../../../shared-kernel/core-logic/models/date-only";
import { ReportBuilder } from "../../../core-logic/builders/Report.builder";
import { ReportBuilderVM } from "../../../core-logic/builders/ReportVM.builder";
import { retrieveReport } from "../../../core-logic/use-cases/report-retrieval/retrieveReport.use-case";
import {
  updateReportRule,
  UpdateReportRuleParams,
} from "../../../core-logic/use-cases/report-rule-update/updateReportRule.use-case";
import { ReportVM } from "../../../core-logic/view-models/ReportVM";
import { initReduxStore, ReduxStore } from "../../../store/reduxStore";
import { selectReport } from "./selectReport";

const testRulesTuple: typeof allRulesTuple = [
  [
    NominationFile.RuleGroup.MANAGEMENT,
    NominationFile.ManagementRule.TRANSFER_TIME,
  ],
];

describe("Select Report", () => {
  let store: ReduxStore;

  beforeEach(() => {
    store = initReduxStore({}, {}, {}, undefined, undefined, testRulesTuple);
    store.dispatch(retrieveReport.fulfilled(aReport, "", ""));
  });

  it("selects the whole report with rules unchecked", async () => {
    expect(selectReport(store.getState(), aReport.id)).toEqual(aReportVM);
  });

  it("after checking a validation  rule, it has its rule checked", () => {
    const updateReportRuleParams: UpdateReportRuleParams = {
      reportId: aReport.id,
      ruleId: aReport.rules.management.TRANSFER_TIME.id,
      validated: false,
    };
    store.dispatch(
      updateReportRule.fulfilled(
        updateReportRuleParams,
        "",
        updateReportRuleParams,
      ),
    );

    expect(selectReport(store.getState(), aReport.id)).toEqual<ReportVM>({
      ...aReportVM,
      rulesChecked: {
        ...aReportVM.rulesChecked,
        management: {
          ...aReportVM.rulesChecked.management,
          TRANSFER_TIME: {
            ...aReportVM.rulesChecked.management.TRANSFER_TIME,
            checked: true,
          },
        },
      },
    });
  });

  const aReport = new ReportBuilder()
    .with("id", "report-id")
    .with("name", "John Doe")
    .with("dueDate", new DateOnly(2030, 10, 30))
    .with("biography", "The biography.")
    .with("observers", [
      "observer 1",
      "observer 2\nVPI TJ Rennes\n(1 sur une liste de 2)",
    ])
    .with("rules.management.TRANSFER_TIME", {
      id: "transfer-time-id",
      preValidated: false,
      validated: true,
      comment: null,
    })
    .buildRetrieveSM();
  const aReportVM = ReportBuilderVM.fromStoreModel(aReport)
    .with("rulesChecked.management.TRANSFER_TIME", {
      id: "transfer-time-id",
      label: ReportVM.rulesToLabels.management.TRANSFER_TIME,
      highlighted: false,
      checked: false,
      comment: null,
    })
    .with("observers", [
      ["observer 1"],
      ["observer 2", "VPI TJ Rennes", "(1 sur une liste de 2)"],
    ])
    .build();
});
